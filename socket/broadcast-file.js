import debug from "debug";
import MultiProgressBar from "multi-progress";

// const ALLOWED = ["jpg"];
const CHUNK_SIZE = 1024;

let log = debug("photo-storage-service:socket-io");

function sendChunk(socket, buffer, file) {
    let id = socket.id;

    return function () {
        // log(`Sent: ${file.sent} - Total: ${buffer.byteLength}`);
        if (file.sent >= buffer.byteLength) {
            socket.emit(`socket:broadcast-file:done:${id}`);

            return;
        }

        let chunk = buffer.slice(file.sent, file.sent + CHUNK_SIZE);
        socket.once(`socket:broadcast-file:request:${id}`, sendChunk(socket, buffer, file));
        socket.emit(`socket:broadcast-file:stream:${id}`, chunk);

        file.sent += chunk.byteLength;
    };
}

export function upload(app, file) {
    return new Promise((root_res, root_rej) => {

        log("Start broadcasting file..");

        let multi = new MultiProgressBar(process.stderr);

        let bars = {};

        let io = app.io;


        let fileInfos = [];

        /* TODO:
            Find another way to listen to client event,
            because if there are a lot of clients, the current way
            is not efficient.
        */
        let promises = app.sockets.map(socket => {
            return new Promise((res, rej) => {
                try {
                    bars[socket.id] = multi.newBar(`  Broadcasting to ${socket.id} [:bar] :percent`, {
                        width: 80,
                        total : file.data.byteLength,
                        complete: "\x1B[0;92m*",
                        incomplete: "-",
                    });


                    fileInfos[socket.id] = {
                        name: file.name,
                        sent: 0
                    };

                    socket.once(`socket:broadcast-file:request:${socket.id}`, sendChunk(socket, file.data, fileInfos[socket.id]));

                    socket.on(`socket:broadcast-file:complete:${socket.id}`, () => {
                        root_res();
                        socket.removeAllListeners(`socket:broadcast-file:request:${socket.id}`);
                        socket.removeAllListeners(`socket:broadcast-file:complete:${socket.id}`);
                        socket.removeAllListeners(`socket:broadcast-file:partly-done:${socket.id}`);
                        socket.removeAllListeners(`socket:broadcast-file:stream:${socket.id}`);
                    });

                    socket.on(`socket:broadcast-file:partly-done:${socket.id}`, info => {
                        bars[socket.id].tick(CHUNK_SIZE);
                    });

                    res();

                } catch (e) {
                    rej(e);
                }
            });
        });

        Promise.all(promises).then(() => {
            io.emit("socket:broadcast-file:create", {
                name: file.name,
                file: file.data
            });
        });
    });
}