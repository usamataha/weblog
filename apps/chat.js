var socket = require('socket.io');
var debug = require('debug')('weblog:chatApp');
var User = require('../models/user');   // Needed if you like to use the server's built-in user handling functions.

/**
 * Updates a User's socketId field asynchronously (bypassing the strict mode).
 * @param {User} User The User to update.
 * @param {id} id The socket.id value.
 */
async function attachSocketId(User, id){
    await User.updateOne({socketId: id}, { strict: false });
}

// The io Object
var io;
// Array to store active users. Move it to the backend service after testing and before deploying
var activeUsers = [];

module.exports = { 
    // The initializer
    init: function (server, path) { 
        if(io) return; // return if already intialized
        io = socket(server, { path: path });
        return io;
    },

    // The getter
    get: function() { 
        if(!io) { debug('socket.io not yet initialized.'); return; } 
        return io;
    },

    // On connect
    connected: function(weblogActiveUser) {

        // Handle the new connection event. Use 'once' not 'on'
        io.once('connection', function (socket) { 
            // Attach the socket.id to the User
            attachSocketId(weblogActiveUser, socket.id);
            // Add the new user to the active list if the socket.id is unique
            if (!activeUsers.some((activeUser) => activeUser.socketId ===  socket.id)) { 
                activeUsers.push({
                    user_name: weblogActiveUser.user_name,
                    socketId: socket.id,    // The weblogActiveUser.socketId field (await)s updating
                    role: weblogActiveUser.role
                });
            }
            if(!activeUsers) return;    // Skip if there're no active users
            // Emit the 'new user' event to the client.
            io.emit('new user', weblogActiveUser.user_name, activeUsers);

            // Handle the connection closed event. Use 'once' not 'on'
            socket.once('disconnect', () => { 
                // Remove the disconnected User from the list
                var disconnectedUser = activeUsers.find( x => x.socketId === socket.id);
                if(!disconnectedUser) return;   // return if there's no match
                activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
                // Emit the 'user disconnected' event to the client.
                io.emit('user disconnected', disconnectedUser.user_name, activeUsers);
            });

            // Respond to 'typing' event from client. Send to the rest of Users not the sender.
            socket.on('typing', function (user_name) { socket.broadcast.emit('typing', user_name); });
            
            // Respond to 'chat message' event from client.
            socket.on('chat message', function (Info) { 
                var sender = activeUsers.find( x => x.socketId === socket.id );
                if(!sender) return;     // return if there's no match

                var reciever;
                var InfoToSend = { recieverName: '', senderName: sender.user_name, messageOption: Info.messageOption, message: Info.message };

                if (Info.recieverName) {
                    reciever = activeUsers.find( x => x.user_name === Info.recieverName );
                    InfoToSend.recieverName = reciever.user_name;
                }

                switch (Info.messageOption) {
                    case 0: // Send to all users
                        io.emit('chat message', InfoToSend);
                        break;

                    case 1: // Send to all users if there's a reciever
                        if(!reciever) return;     // return if there's no match
                        io.emit('chat message', InfoToSend);
                        break;

                    case 2: // Send to sender and reciever only
                        if(!reciever) return;     // return if there's no match
                        io.to(reciever.socketId).emit('chat message', InfoToSend);

                        InfoToSend.message = `PM To: ${Info.recieverName}: ` + InfoToSend.message;
                        io.to(sender.socketId).emit('chat message', InfoToSend);
                        break;
                }
            });

            // Respond to 'kick user' event from the client.
            socket.on('kick user', async function (userToHandle) { 
                var sender = activeUsers.find( x => x.socketId === socket.id );
                if(!sender) return;     // return if there's no match

                var kickedUser = activeUsers.find( x => x.user_name === userToHandle );
                if(!kickedUser) return;     // return if there's no match

                // Prepare the result info.
                var InfoToSend = { recieverName: '', senderName: 'Server', messageOption: 2, message: '' };
                
                // Check the chain of command
                if (kickedUser.role === 'moderator' || sender.role === kickedUser.role) {
                    InfoToSend.recieverName = sender.use_name;
                    InfoToSend.message = "You can't kick an equal or a superior user or any moderator!"
                    io.to(sender.socketId).emit('chat message', InfoToSend);    // PM the sender
                }
                else {
                    InfoToSend.recieverName = kickedUser.user_name;
                    InfoToSend.message = `You've been kicked out by: ${sender.user_name}.`

                    var socketToClose = io.sockets.sockets.get(kickedUser.socketId);
                    socketToClose.emit('chat message', InfoToSend);    // PM the kicked user
                    socketToClose.disconnect(true);     // The 'user disconnected' event will fire automatically.

                    // Notify everyone with the incident.
                    io.emit('server notification', `${kickedUser.user_name} was kicked by ${sender.user_name}`);
                }
            });

            // Respond to 'ban user' event from the client.
            socket.on('ban user', async function (userToHandle) { 
                var sender = activeUsers.find( x => x.socketId === socket.id );
                if(!sender) return;     // return if there's no match

                var bannedUser = activeUsers.find( x => x.user_name === userToHandle );
                if(!bannedUser) return;     // return if there's no match

                // Prepare the result info.
                var InfoToSend = { recieverName: '', senderName: 'Server', messageOption: 2, message: '' };
                
                // Check the chain of command
                if (bannedUser.role === 'moderator' || sender.role ===bannedUser.role) {
                    InfoToSend.recieverName = sender.use_name;
                    InfoToSend.message = "You can't ban an equal or a superior user or any moderator!"
                    io.to(sender.socketId).emit('chat message', InfoToSend);    // PM the sender
                }
                else {
                    InfoToSend.recieverName = bannedUser.user_name;
                    InfoToSend.message = `You've been banned by: ${sender.user_name}.`

                    var socketToClose = io.sockets.sockets.get(bannedUser.socketId);
                    socketToClose.emit('chat message', InfoToSend);    // PM the kicked user
                    // Force a logout
                    socketToClose.emit('redirect', '/users/logout');

                    socketToClose.disconnect(true);     // The 'user disconnected' event will fire automatically.

                    // Use the server's built-in mechanism to ban the user
                    // Extract the user's '_id' first
                    var senderSocket = io.sockets.sockets.get(sender.socketId);
                    var bannedUserModel = await User.findOne({user_name: bannedUser.user_name});
                    senderSocket.emit('redirect', `/users/${bannedUserModel._id}/ban`);

                    // Notify everyone with the incident.
                    io.emit('server notification', `${bannedUser.user_name} was banned by ${sender.user_name}`);
                }
            });
        });
    }
}