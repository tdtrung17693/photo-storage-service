import IO from "socket.io";
import debug from "debug";
import { upload } from "./broadcast-file";

function io(server, app) {

    let log = debug("photo-storage-service:socket-io");
    log("inside io");
    let io = IO(server);
    app.io = io;
    app.sockets = [];

    io.on("connection", socket => {
        log(`${socket.id} connected.`);
        app.sockets.push(socket);

        socket.on("disconnect", () => {
            log(`${socket.id} disconnected.`);
            app.sockets.splice(app.sockets.indexOf(socket), 1);
        });
    });

}

export { io, upload };