//Code for chat system

let chatCounter = 0;

const wsEndpoint = 'wss://' + window.location.host + '/wss/chat/';
const websocket = new WebSocket(wsEndpoint);

websocket.onopen = () => {
    console.log('WebSocket chat connected');
    websocket.send(
        JSON.stringify({
            action: 'checkTournament'
        })
    );
};

websocket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    console.log('Event Socket : ' + data.type);
    if (data.type === 'chat_message') {
        getMessages();
    }
    else if (data.type === 'add_tour_chat') {
        openTournamentChat(data.name);
        getMessages();
    }
    else if (data.type == 'returnPing') {
        var divData = document.querySelectorAll('div[friend-pseudo]');
        divData.forEach(function (div) {
            var id = div.getAttribute('friend-pseudo');
            if (id == data.pseudo) {
                div.removeChild(div.firstChild);
                var statut_text = $('<i style="color: green;">(online)</i>');
                div.append(statut_text[0]);
            }
        });
    }
    else if (data.type == 'sendPing') {
        websocket.send(
            JSON.stringify({
                action: 'returnPing',
                from_pseudo: data.from_pseudo,
                to_pseudo: data.to_pseudo
            })
        );
    }
    else if (data.type == 'sendInvitation') {
        newInvitation(data.pseudo, data.channel)
    }
    else if (data.type === 'game_start') {
        window.location.href = "#games";
        displayDiv('ChooseGame', 'BackMenu');
        import('/static/js/game.js?ver=${Math.random()}')
        .then(module => {
            const { reloadGame } = module;
            reloadGame(data.game_id, data.p1_pseudo, data.p2_pseudo);
        })
        .catch(error => {
            console.error('Une erreur s\'est produite lors du chargement de game.js : ', error);
        });
        console.log(data.message);
        $('#Msg').text('Message: ' + data.message);
    }
};

function newInvitation(from, channel) {
    var invDiv = document.createElement('div');
    invDiv.className = 'invitation-box';
    var friendDiv = document.createElement('div');
    friendDiv.className = 'friends-list';
    var TextRow = $('<div class="clickable-row name" data-pseudo="' + from + '">' + from + ' want to fight you !</div>');
    var acceptRow = $('<div class="clickable-row" title="Block this friend" data-pseudo="' + from + '"><span class="close-icon">✅</span></div>');
    acceptRow.click(function (event) {
        websocket.send(
            JSON.stringify({
                action: 'acceptInvitation',
                to_pseudo: from,
                channel: channel
            })
        );
        event.stopPropagation();
        var parent = invDiv.parentElement;
        parent.removeChild(invDiv);
    });
    var refuseRow = $('<div class="clickable-row" title="Delete this friend" data-pseudo="' + from + '"><span class="close-icon">❌</span></div>');
    refuseRow.click(function (event) {
        event.stopPropagation();
        var parent = invDiv.parentElement;
        parent.removeChild(invDiv);
    });

    friendDiv.append(TextRow[0]);
    friendDiv.append(acceptRow[0]);
    friendDiv.append(refuseRow[0]);
    invDiv.append(friendDiv);
    document.body.appendChild(invDiv);
}

function openTournamentChat(pseudo) {
    var chatDiv = document.createElement('div');
    chatDiv.id = 'chat-box-' + chatCounter;
    chatDiv.id = pseudo;
    chatDiv.className = 'chat-box';
    chatDiv.style.left = 10 * chatCounter + 'rem';
    var toggleDiv = document.createElement('div');
    toggleDiv.className = 'chat-box-toggle';

    var titleP = document.createElement('p');
    titleP.textContent = 'Tournament: ' + pseudo;
    titleP.style.fontSize = '14px';
    toggleDiv.appendChild(titleP);
    chatDiv.appendChild(toggleDiv);

    var contentDiv = document.createElement('div');
    contentDiv.id = 'chat-box-content';
    contentDiv.className = 'chat-box-content';
    var chatP = document.createElement('p');
    chatP.textContent = pseudo;
    contentDiv.appendChild(chatP);

    var formHTML = `
        <form id="${pseudo + chatCounter}" enctype="multipart/form-data" action="/sendChat/" method="post">
        <input type="hidden" name="type" value="sendChat">
        <input type="hidden" name="id_to" value="${pseudo}">
        <input type="hidden" name="tournament" value="True">
        <input type="text" id="content" name="content" style="display: block; position: absolute; bottom: 0; left: 0; margin-bottom: 1px;" required>
        <div style="display: none;"><button type="submit" onclick="sendForm('${pseudo + chatCounter}', event); clearInput(this)" alt="fck tes css alex">Login</button></div>
        <div id="error-form" class="error-form"></div>
        </form>
    `;
    contentDiv.innerHTML = formHTML;
    chatDiv.appendChild(contentDiv);

    toggleDiv.addEventListener('click', function () {
        chatDiv.classList.toggle('chat-box-open');
        contentDiv.scrollTop = contentDiv.scrollHeight;
    });
    document.body.appendChild(chatDiv);
    chatCounter++;
}

function openChat(pseudo) {
    if (chatCounter >= 5) {
        alert("You have already 5 chat box !");
        return;
    }
    var chatDiv = document.createElement('div');
    chatDiv.id = 'chat-box-' + chatCounter;
    chatDiv.id = pseudo;
    chatDiv.className = 'chat-box';
    chatDiv.style.left = 10 * chatCounter + 'rem';
    var toggleDiv = document.createElement('div');
    toggleDiv.className = 'chat-box-toggle';

    var closeIcon = document.createElement('span');
    closeIcon.className = 'close-icon';
    closeIcon.innerHTML = '&times;';
    toggleDiv.appendChild(closeIcon);

    var titleP = document.createElement('p');
    titleP.textContent = pseudo;
    toggleDiv.appendChild(titleP);
    chatDiv.appendChild(toggleDiv);

    var contentDiv = document.createElement('div');
    contentDiv.id = 'chat-box-content';
    contentDiv.className = 'chat-box-content';
    var chatP = document.createElement('p');
    chatP.textContent = pseudo;
    contentDiv.appendChild(chatP);

    var formHTML = `
        <form id="${pseudo + chatCounter}" enctype="multipart/form-data" action="/sendChat/" method="post">
        <input type="hidden" name="type" value="sendChat">
        <input type="hidden" name="id_to" value="${pseudo}">
        <input type="text" id="content" name="content" style="display: block; position: absolute; bottom: 0; left: 0; margin-bottom: 1px;" required>
        <div style="display: none;"><button type="submit" onclick="sendForm('${pseudo + chatCounter}', event); clearInput(this)" alt="fck tes css alex">Login</button></div>
        <div id="error-form" class="error-form"></div>
        </form>
    `;
    contentDiv.innerHTML = formHTML;
    chatDiv.appendChild(contentDiv);

    toggleDiv.addEventListener('click', function () {
        chatDiv.classList.toggle('chat-box-open');
        contentDiv.scrollTop = contentDiv.scrollHeight;
    });
    closeIcon.addEventListener('click', function (event) {
        event.stopPropagation();
        var parent = chatDiv.parentElement;
        parent.removeChild(chatDiv);
        chatCounter--;
        var chatBoxes = document.getElementsByClassName('chat-box');
        for (var i = 0; i < chatBoxes.length; i++) {
            chatBoxes[i].style.left = 10 * i + 'rem';
        }
    });
    document.body.appendChild(chatDiv);
    chatCounter++;
}

function loadFriends() {
    displayDiv('loader', 'error-block');
    $.ajax({
        type: 'GET',
        url: '/getFriends/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            if (data.success) {
                var friendsList = data.friends;
                var friendsContainer = $('#friends');
                friendsContainer.empty();
                friendsList.forEach(function (friend) {
                    var friendDiv =$('<div class="friends-list"></div>');
                    var clickableRow = $('<div class="clickable-row name" data-pseudo="' + friend.pseudo + '"><p>' + friend.pseudo + '</p></div>');
                    clickableRow.click(function () {
                        var chatDiv = document.getElementById(friend.pseudo);
                        if (!chatDiv) {
                            openChat(friend.pseudo);
                            getMessages();
                        }
                    });
                    var statut = $('<div class="clickable-row name" style="font-size: 14px;" friend-pseudo="' + friend.pseudo + '"></div>');
                    var statut_text = $('<i style="color: red;">(offline)</i>');
                    
                    statut.append(statut_text[0]);
                    var FightRow = $('<div class="clickable-row" title="Block this friend" data-pseudo="' + friend.pseudo + '"><span class="close-icon">⚔️</span></div>');
                    FightRow.click(function (event) {
                        websocket.send(
                            JSON.stringify({
                                action: 'versusInvitation',
                                pseudo: friend.pseudo
                            })
                        );
                    });
                    var BlockRow = $('<div class="clickable-row" title="Block this friend" data-pseudo="' + friend.pseudo + '"><span class="close-icon">🔒</span></div>');
                    BlockRow.click(function (event) {
                        blockFriend(friend.pseudo, false);
                    });
                    var deleteRow = $('<div class="clickable-row" title="Delete this friend" data-pseudo="' + friend.pseudo + '"><span class="close-icon">❌</span></div>');
                    deleteRow.click(function (event) {
                        deleteFriend(friend.pseudo);
                    });
                    friendDiv.append(clickableRow[0]);
                    friendDiv.append(statut[0]);
                    friendDiv.append(FightRow[0]);
                    friendDiv.append(BlockRow[0]);
                    friendDiv.append(deleteRow[0]);
                    friendsContainer.append(friendDiv);
                    websocket.send(
                        JSON.stringify({
                            action: 'getStatut',
                            pseudo: friend.pseudo
                        })
                    );
                });
            }
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des amis.');
        }
    });
}

function loadBlockedFriends() {
    displayDiv('loader', 'error-block');
    $.ajax({
        type: 'GET',
        url: '/getBlockedFriends/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            if (data.success) {
                var friendsList = data.friends;
                var friendsContainer = $('#blocked-friend');
                friendsContainer.empty();
                friendsList.forEach(function (friend) {
                    var friendDiv =$('<div class="friends-list"></div>');
                    var clickableRow = $('<div class="clickable-row name" data-pseudo="' + friend.pseudo + '">' + friend.pseudo + '</div>');
                    clickableRow.click(function () {
                    });
                    var BlockRow = $('<div class="clickable-row" title="Block this friend" data-pseudo="' + friend.pseudo + '"><span class="close-icon">🔓</span></div>');
                    BlockRow.click(function (event) {
                        blockFriend(friend.pseudo, true);
                    });
                    friendDiv.append(clickableRow[0]);
                    friendDiv.append(BlockRow[0]);
                    friendsContainer.append(friendDiv);
                });
            }
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des amis.');
        }
    });
}

function deleteFriend(pseudo) {
    var formData = new FormData();
    formData.append('type', 'addFriend');
    formData.append('delete', 'true');
    formData.append('addfriendName', pseudo);

    $.ajax({
        type: 'POST',
        url: '/addFriend/',
        headers: { 'X-CSRFToken': token },
        processData: false,
        contentType: false,
        data: formData,
        success: function (data) {
            loadFriends();
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des amis.');
        }
    });
}

function blockFriend(pseudo, unblock) {
    displayDiv('eror-block', 'loader');
    var formData = new FormData();
    formData.append('type', 'blockFriend');
    formData.append('block', (unblock ? 'false' : 'true'));
    formData.append('blockFriendName', pseudo);

    $.ajax({
        type: 'POST',
        url: '/blockFriend/',
        headers: { 'X-CSRFToken': token },
        processData: false,
        contentType: false,
        data: formData,
        success: function (data) {
            if (data.success) {
                $('#error-block').text(data.errors);
            } else {
                $('#error-block').text(data.errors);
            }
            console.log(data.errors)
            loadFriends();
            loadBlockedFriends();
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des amis.');
        }
    });
}

function getMessages() {
    $.ajax({
        type: 'GET',
        url: '/getChat/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            var messages = data.messages;
            var messages_tour = data.message_tour;
            var chatBoxContents = document.querySelectorAll('.chat-box-content');
            chatBoxContents.forEach(function (chatBoxContent) {
                var paragraphs = chatBoxContent.querySelectorAll('p');
                paragraphs.forEach(function (paragraph) {
                    paragraph.remove();
                });
                messages.forEach(function (message) {
                    var id = message.pseudo_from === message.me ? message.pseudo_to : message.pseudo_from;
                    var chatDiv = document.getElementById(id);
                    if (!chatDiv)
                        return;
                    var chatBoxContent = chatDiv.querySelector('.chat-box-content');
                    if (!chatBoxContent)
                        return;
                    var messageElement = document.createElement('p');
                    messageElement.style.color = "black";
                    messageElement.style.fontSize = "16px";
                    messageElement.style.textAlign = "left";

                    var from = message.pseudo_from === message.me ? '<b>Moi : </b>' : '<b>' + message.pseudo_from + ' : </b>';
                    messageElement.innerHTML = from + message.content;

                    chatBoxContent.appendChild(messageElement);
                    chatBoxContent.scrollTop = chatBoxContent.scrollHeight;
                });
            });
            if (messages_tour) {
                messages_tour.forEach(function (message) {
                    var chatDiv = document.getElementById(message.pseudo_to);
                    if (!chatDiv)
                        return;
                    var chatBoxContent = chatDiv.querySelector('.chat-box-content');
                    if (!chatBoxContent)
                        return;
                    var messageElement = document.createElement('p');
                    messageElement.style.color = "black";
                    messageElement.style.fontSize = "16px";
                    messageElement.style.textAlign = "left";

                    var from = message.pseudo_from === message.me ? '<b>Moi : </b>' : '<b>' + message.pseudo_from + ' : </b>';
                    messageElement.innerHTML = from + message.content;

                    chatBoxContent.appendChild(messageElement);
                    chatBoxContent.scrollTop = chatBoxContent.scrollHeight;
                });
            }
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des amis.');
        }
    });
}