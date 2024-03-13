var upHist = false;
let chatCounter = 0;

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
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            var errorForm = form.querySelector('.error-form');
            if (response.success) {
                if (formData.get('type') == 'sendChat') {
                    fetchMessages();
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
        }
    };
    xhr.send(formData);
    event.preventDefault();
}

function loadProfileData() {
    $.ajax({
        type: 'GET',
        data: { data: 'profil' },
        success: function (data) {
            $('#username').text('Username: ' + data.username);
            $('#pseudo').text('Pseudo: ' + data.pseudo);
            $('#email').text('Email: ' + data.email);
            $('#img').attr('src', data.img);
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des données du profil.');
        }
    });
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
        <form id="sendChatForm" enctype="multipart/form-data" action="/" method="post">
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
        fetchMessages(); //Delete this later to setInterval
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
        data: { data: 'friends' },
        success: function (data) {
            if (data.success) {
                var friendsList = data.friends;
                var friendsContainer = $('#friends');
                friendsContainer.empty();
                friendsList.forEach(function (friend) {
                    var clickableRow = $('<div class="friends-list"><div class="clickable-row" data-pseudo="' + friend.pseudo + '">' + friend.pseudo + '</div>');
                    clickableRow.click(function () {
                        var chatDiv = document.getElementById(friend.pseudo);
                        if (!chatDiv) {
                            openChat(friend.pseudo);
                            fetchMessages();
                        }
                    });
                    var clickableRow = $('<div class="clickable-row" data-pseudo="' + friend.pseudo + '"><span class="close-icon">×</span></div>');
                    clickableRow.click(function () {
                        var chatDiv = document.getElementById(friend.pseudo);
                        if (!chatDiv) {
                            openChat(friend.pseudo);
                            fetchMessages();
                        }
                    });
                    friendsContainer.append(clickableRow);
                });
            }
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des amis.');
        }
    });
}

function checkURL() {
    if (window.location.hash === "#profil")
        loadProfileData();
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

function fetchMessages() {
    $.ajax({
        type: 'GET',
        data: { data: 'chat' },
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
                    
                    var from = message.pseudo_from === message.me ? '<b>Moi : </b>' : '<b>' + message.pseudo_to + ' : </b>';
                    messageElement.innerHTML = from + message.content;

                    chatBoxContent.appendChild(messageElement);
                    chatBoxContent.scrollTop = chatBoxContent.scrollHeight;
                });
            });
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
};


// setInterval(fetchMessages, 1000);