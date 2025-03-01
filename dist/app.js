import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "node:path";
import { getPlatform } from "./utils/functions.js";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    },
    pingTimeout: 60000, // Set timeout to 60 seconds
    pingInterval: 25000, // Set interval to 25 seconds
});
//for production
const _dirname = path.resolve();
app.use(express.static(path.join(_dirname, "/dist")));
app.get("*", (_, res) => {
    res.sendFile(path.resolve(_dirname, "dist", "index.html"));
});
let users = [];
const fileChunks = {};
io.on("connection", (socket) => {
    // Listen for user details
    socket.on("userDetails", ({ userAgent, fullName }) => {
        const platform = getPlatform(userAgent); // Determine the platform
        users.push({ id: socket.id, userAgent: platform, fullName }); // Store user ID with platform
        io.emit("users", users); // Emit the updated user list
    });
    // Send updated user list to all clients
    io.emit("users", users);
    // Immediately send the current list of users to the newly connected user
    socket.emit("users", users);
    //send the senderId to the target user
    socket.on("getSender", (data) => {
        const { targetUser, size, name } = data;
        const sender = users.find((user) => user.id === socket.id);
        io.to(targetUser.id).emit("sender", { sender, size, name });
    });
    //send the progress percent to the target user
    socket.on("progress", ({ progressPer, targetUser }) => {
        io.to(targetUser.id).emit("progressPer", { progressPer });
    });
    //send the file response to the sender
    socket.on("fileResponse", ({ acceptFile, sender }) => {
        io.to(sender.id).emit("fileTransfer", { acceptFile, sender });
    });
    //send the text to the target user
    socket.on("sendMessage", ({ msg, targetUser }) => {
        const sender = users.find((user) => user.id === socket.id);
        io.to(targetUser.id).emit("receiveMessage", { msg, sender });
    });
    // Handle file sending
    socket.on("sendFileChunk", (data) => {
        const { targetUser, fileData, chunkNumber, totalChunks, fileName, fileType, } = data;
        console.log(`Receiving chunk ${chunkNumber + 1} of ${totalChunks} for file ${fileName}`);
        // Initialize the file data storage if it doesn't exist
        if (!fileChunks[targetUser.id]) {
            fileChunks[targetUser.id] = {
                chunks: [],
                fileName,
                fileType,
            };
        }
        // Append the chunk to the user's file data
        fileChunks[targetUser.id].chunks.push(fileData);
        // If this is the last chunk, reconstruct the file
        if (chunkNumber === totalChunks - 1) {
            const buffer = Buffer.concat(
            //Unit8Array(chunk) for ensuring each chunk in byte format i.e binary format as 1 and 0
            // Then Buffer.from() converts this byte data into a buffer which is designed to handle binary data (raw data) directly
            fileChunks[targetUser.id].chunks.map((chunk) => Buffer.from(new Uint8Array(chunk))));
            console.log(`File ${fileName} received fully.`);
            // Emit the file data to the recipient
            io.to(targetUser.id).emit("receiveFile", {
                fileName,
                fileType,
                fileData: buffer,
            });
            // Cleanup after sending the file
            delete fileChunks[targetUser.id];
        }
    });
    // Handle user disconnect
    socket.on("disconnect", (reason) => {
        console.log("A user disconnected:", socket.id);
        console.log("Reason: ", reason);
        users = users.filter((user) => user.id !== socket.id);
        io.emit("users", users); // Update clients with the current list
    });
});
export default httpServer;
