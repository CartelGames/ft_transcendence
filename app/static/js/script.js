var upHist = false;
let chatCounter = 0;
var token = getCSRFToken();

const wsEndpoint = 'ws://' + window.location.host + '/ws/chat/';
const websocket = new WebSocket(wsEndpoint);

websocket.onopen = () => {
    console.log('WebSocket connected');
};

websocket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    console.log('Event Socket : ' + data.type);
    if (data.type === 'chat_message') {
        console.log('GetMessage');
        getMessages();
    }
};

function getCSRFToken() {
    var csrfTokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');

    if (csrfTokenInput) {
        var csrfToken = csrfTokenInput.value;
        return csrfToken;
    } else {
        console.error("CSRF Token input not found!");
        return null;
    }
}

function showDiv(divId) {
    var divs = document.querySelectorAll('.block');
    divs.forEach(function (div) {
        div.style.display = 'none';
    });

    var selectedDiv = document.getElementById(divId);
    if (selectedDiv) {
        selectedDiv.style.display = 'block';

        if (!upHist) {
			var stateObj = { divId: divId };
			var url = window.location.href.split('#')[0] + '#' + divId;
			history.pushState(stateObj, null, url);
            checkURL();
		}
		else
			upHist = false;
    }
}

function sendForm(id, event) {
    var form = document.getElementById(id);
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', form.action, true);
    xhr.setRequestHeader('X-CSRFToken', token);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            var errorForm = form.querySelector('.error-form');
            if (response.success) {
                if (formData.get('type') == 'sendChat') {
                    websocket.send(
                        JSON.stringify({
                            action: 'sendChat',
                            pseudo: formData.get('id_to')
                        })
                    );
                    getMessages();
                    return;
                }
                if (errorForm)
                    errorForm.innerHTML = response.errors;
                if (response.goto) {
                    setTimeout(function () {
                        window.location.href = response.goto;
                        location.reload(true);
                        if (errorForm)
                            errorForm.innerHTML = "";
                    }, 2000);
                }
                else if (window.location.hash === "#profil")
                    loadProfileData();
            } else {
                if (errorForm)
                    errorForm.innerHTML = response.errors;
            }
            token = response.csrf_token;
        }
    };
    xhr.send(formData);
    event.preventDefault();
}

function loadProfileData() {
    $.ajax({
        type: 'GET',
        url: '/getProfil/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            $('#username').text('Username: ' + data.username);
            $('#pseudo').text('Pseudo: ' + data.pseudo);
            $('#email').text('Email: ' + data.email);
            $('#img').attr('src', data.img);
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des données du profil.');
        }
    });
}

async function getPseudo() {
    try {
      const response = await $.ajax({
        type: 'GET',
        url: '/getProfil/',
        headers: { 'X-CSRFToken': token },
      });
      token = response.csrf_token;
      return response.users[0];
    } catch (error) {
      console.log('Erreur lors de la récupération des données du profil.');
    }
  }

function clearInput(button) {
    var form = button.closest('form');
    if (form) {
        var inputField = form.querySelector('input[name="content"]');
        if (inputField) {
            inputField.value = '';
        }
    }
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
    chatDiv.style.left = 20 * chatCounter + 'vh';
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
        <form id="sendChatForm" enctype="multipart/form-data" action="/sendChat/" method="post">
        <input type="hidden" name="type" value="sendChat">
        <input type="hidden" name="id_to" value="${pseudo}">
        <input type="hidden" name="csrfmiddlewaretoken" value="">
        <input type="text" id="content" name="content" required>
        <div class="hide"><button type="submit" onclick="sendForm('sendChatForm', event); clearInput(this)">Login</button></div>
        <div id="error-form" class="error-form"></div>
        </form>
    `;
    contentDiv.innerHTML = formHTML;
    chatDiv.appendChild(contentDiv);

    toggleDiv.addEventListener('click', function () {
        chatDiv.classList.toggle('chat-box-open');
        getMessages(); //Delete this later to setInterval
        contentDiv.scrollTop = contentDiv.scrollHeight;
    });
    closeIcon.addEventListener('click', function (event) {
        event.stopPropagation();
        var parent = chatDiv.parentElement;
        parent.removeChild(chatDiv);
        chatCounter--;
        var chatBoxes = document.getElementsByClassName('chat-box');
        for (var i = 0; i < chatBoxes.length; i++) {
            chatBoxes[i].style.left = 20 * i + 'vh';
        }
    });
    document.body.appendChild(chatDiv);
    chatCounter++;
}

function loadFriends() {
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
                    var clickableRow = $('<div class="clickable-row name" data-pseudo="' + friend.pseudo + '">' + friend.pseudo + '</div>');
                    clickableRow.click(function () {
                        var chatDiv = document.getElementById(friend.pseudo);
                        if (!chatDiv) {
                            openChat(friend.pseudo);
                            getMessages();
                        }
                    });
                    var BlockRow = $('<div class="clickable-row" title="Block this friend" data-pseudo="' + friend.pseudo + '"><span class="close-icon">o</span></div>');
                    BlockRow.click(function (event) {
                        blockFriend(friend.pseudo, false);
                    });
                    var deleteRow = $('<div class="clickable-row" title="Delete this friend" data-pseudo="' + friend.pseudo + '"><span class="close-icon">×</span></div>');
                    deleteRow.click(function (event) {
                        deleteFriend(friend.pseudo);
                    });
                    friendDiv.append(clickableRow[0]);
                    friendDiv.append(BlockRow[0]);
                    friendDiv.append(deleteRow[0]);
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

function loadBlockedFriends() {
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
                        // var chatDiv = document.getElementById(friend.pseudo);
                        // if (!chatDiv) {
                        //     openChat(friend.pseudo);
                        //     getMessages();
                        // }
                    });
                    var BlockRow = $('<div class="clickable-row" title="Block this friend" data-pseudo="' + friend.pseudo + '"><span class="close-icon">o</span></div>');
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
            if (data.success) {
                console.log('friend deleted');
            }
            loadFriends();
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des amis.');
        }
    });
}

function blockFriend(pseudo, unblock) {
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
            if (data.success)
                $('#error-block').text(data.errors);
            else
                $('#error-block').text(data.errors);
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

function checkURL() {
    if (window.location.hash === "#profil")
        loadProfileData();
    if (window.location.hash === "#stats")
        loadStats();
}

function loadStats() {
    $.ajax({
        type: 'GET',
        url: '/getStats/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            if (data.success) {
                var usersList = data.users;
                var usersContainer = $('#stats-users-container');
                usersContainer.empty();
                usersList.forEach(function (user) {
                    printStats(user);
                });
            }
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des joueurs.');
        }
    });
}

function printStats(user) {
    var statCont = document.getElementById('stats-users-container');
    var userList = document.createElement('div');
    userList.className = 'users-list';

    var list = document.createElement('tr');
    userList.appendChild(list);

    var attr = document.createElement('td');
    attr.className = 'pseudo';
    attr.textContent = user.pseudo;
    list.appendChild(attr);
    var attr2 = document.createElement('td');
    attr2.className = 'img';
    var img = document.createElement('td');
    img.src = user.img;
    attr2.appendChild(img);
    list.appendChild(attr2);
    var attr3 = document.createElement('td');
    attr3.className = 'nb_game';
    attr3.textContent = user.nb_game;
    list.appendChild(attr3);
    var attr4 = document.createElement('td');
    attr4.className = 'mmr';
    attr4.textContent = user.mmr;
    list.appendChild(attr4);

    userList.addEventListener('click', function () {
        var url = window.location.href + '#' + user.pseudo;
    })
    // statCont.innerHTML;
    statCont.appendChild(userList);
}

window.addEventListener('hashchange', function () {
	var divId = location.hash.slice(1) || 'index';
	upHist = true;
	console.log("Call hashchange : " + divId);
    showDiv(divId);
});

document.addEventListener('DOMContentLoaded', function () {
    var defaultDivId = location.hash.slice(1) || 'index';
	console.log("First call : " + defaultDivId);
    showDiv(defaultDivId);
});

document.addEventListener('DOMContentLoaded', function () {
    var chat = document.getElementById('chat');
    var chatToggle = document.getElementById('chat-toggle');
    if (chat && chatToggle) {
        chatToggle.addEventListener('click', function () {
            chat.classList.toggle('chat-open');
        });
    }
});

document.getElementById('profil-img').addEventListener('change', function (event) {
    sendForm('profilImg', event)
});

function getMessages() {
    $.ajax({
        type: 'GET',
        url: '/getChat/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            var messages = data.messages;
 
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
                    
                    var from = message.pseudo_from === message.me ? '<b>Moi : </b>' : '<b>' + message.pseudo_from + ' : </b>';
                    messageElement.innerHTML = from + message.content;

                    chatBoxContent.appendChild(messageElement);
                    chatBoxContent.scrollTop = chatBoxContent.scrollHeight;
                });
            });
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des amis.');
        }
    });
}

function displayDiv(hide, show) {
    var hideDiv = document.getElementById(hide);
    if (hideDiv)
        hideDiv.style.display = 'none';
    
    var showDiv = document.getElementById(show);
    if (showDiv)
    showDiv.style.display = 'block';
}

window.onload = function() {
    loadFriends();
    loadBlockedFriends();
};


// setInterval(getMessages, 1000);