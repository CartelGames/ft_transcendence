const wsEndpoint = 'ws://' + window.location.host + '/ws/queue/';
const websocket = new WebSocket(wsEndpoint);

websocket.onopen = () => {
    console.log('WebSocket Queue connected');
};

websocket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    console.log('Event Queue Socket : ' + data.type);
    if (data.type === 'game_start') {
        var HideDiv = document.getElementById('LeaveQueue');
        HideDiv.style.display = 'none';
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
    else if (data.type === 'msg') {
        $('#Msg').text('Message: ' + data.message);
    }
};

function LaunchQueue() {
    websocket.send(
        JSON.stringify({
            action: 'join_queue',
        })
    );
    var HideDiv = document.getElementById('ChooseGame');
    HideDiv.style.display = 'none';
    var showDiv = document.getElementById('LeaveQueue');
    showDiv.style.display = 'block';
}

function LeaveQueue() {
    websocket.send(
        JSON.stringify({
            action: 'leave_queue',
        })
    );
    var HideDiv = document.getElementById('LeaveQueue');
    $('#Msg').text('');
    HideDiv.style.display = 'none';
    var showDiv = document.getElementById('ChooseGame');
    showDiv.style.display = 'block';
}

function TournamentInfo(id) {
    displayDiv('ChooseTour', 'InfoTour');
    $.ajax({
        type: 'GET',
        url: '/getTournamentInfo/?id=' + id,
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            if (data.success) {
                var TournamentContainer = $('#InfoTourUpdate');
                TournamentContainer.empty();
                var TourInfo = data.tourList;
                var TourPlayers = data.player;
                var Title =$('<h1 style="font-weight: bold; font-size: 26px">Tournament name : ' + TourInfo[0].name + '</h1>');
                var Title2 =$('<h1 style="font-weight: bold; font-size: 20px"><i>Created by ' + TourInfo[0].creator + '</i></h1><hr /><br />');
                TournamentContainer.append(Title);
                TournamentContainer.append(Title2);
                var Players =$('<h1 style="font-weight: bold; font-size: 24px">Players registered (' + TourInfo[0].players + ') :</h1>');
                var PlayersList =$('<p></p>');
                TourPlayers.forEach(function (player) {
                    var pseudo =$('<span> ' + player.pseudo + ',</span>');
                    PlayersList.append(pseudo[0]);
                });
                TournamentContainer.append(Players);
                TournamentContainer.append(PlayersList);
                if (TourInfo[0].state == 1) {
                    var TitleStatut = $('<h1 style="font-size: 20px; margin-top:40px; margin-bottom:40px">Tournament statut : <b>In progress</b></h1>');
                    TournamentContainer.append(TitleStatut);
                    var games = data.games;
                    if (games) {
                        var phase = null;
                        games.forEach(function (game) {
                            if (phase !== game.phase) {
                                phase = game.phase;
                                var text = null;
                                switch(game.phase) {
                                    case 0:
                                        text = "Final"
                                        break;
                                    case 1:
                                        text = "Semifinals"
                                        break;
                                    case 3:
                                        text = "Quarterfinals"
                                        break;
                                    default:
                                        text = game.phase;
                                        break;
                                }
                                var phase_txt =$('<h1 style="font-weight: bold; font-size: 28px">Phase ' + text + '</h1>');
                                TournamentContainer.append(phase_txt);
                            }
                            var game_li =$('<li><span style="font-weight: bold; font-size: 24px">' + game.p1 + ' VS ' + game.p2 + '</span> </li>');
                        
                            if (game.state == 2) {
                                var JoinGame = $('<button type="submit" style="margin-left: 25px;">Join the game</button>');
                                JoinGame.click(function () {
                                    var showDiv = document.getElementById('InfoTour');
                                    showDiv.style.display = 'none';
                                    import('/static/js/game.js?ver=${Math.random()}')
                                    .then(module => {
                                        const { reloadGame } = module;
                                        reloadGame(game.id, game.p1, game.p2);
                                    })
                                    .catch(error => {
                                        console.error('Une erreur s\'est produite lors du chargement de game.js : ', error);
                                    });
                                });
                                game_li.append(JoinGame[0]);
                            }
                            else if (game.state == 3) {
                                var game_wini =$('<span style="font-weight: bold; font-size: 24px; color:green;"> Winner : ' + game.winner + '</span>');
                                game_li.append(game_wini);
                            }

                            TournamentContainer.append(game_li);
                        });
                    }
                }
                else {
                    var TitleStatut = $('<h1 style="font-size: 20px; margin-top:40px; margin-bottom:40px">Tournament statut : <b>Not launched yet</b></h1>');
                    TournamentContainer.append(TitleStatut);
                }

                if (data.owner) {
                    if (TourInfo[0].state == 0) {
                        var launchTour = $('<button type="submit" style="margin-right: 35px;">Launch the tournament</button>');
                        launchTour.click(function () {
                            TournamentUpdate(id, 'start');
                            setTimeout(function() {
                                TournamentInfo(id);
                            }, 1000);
                        });
                        TournamentContainer.append(launchTour[0]);
                    }
                    var deleteTour = $('<button2 type="submit">Delete this tournament</button2>');
                    deleteTour.click(function () {
                        TournamentUpdate(id, 'delete');
                        setTimeout(function() {
                            getTournamentList();
                            displayDiv('InfoTour', 'ChooseTour');
                        }, 300);
                    });
                    TournamentContainer.append(deleteTour[0]);
                }

                var refreshTour = $('<div class="butt"><button type="submit" style="margin-top: 50px;">Refresh</button></div>');
                refreshTour.click(function () {
                    TournamentInfo(id)
                });
                TournamentContainer.append(refreshTour[0]);
            }
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Can\'t load tournament info.');
        }
    });
}

function getTournamentList() {
    $.ajax({
        type: 'GET',
        url: '/getTournamentList/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            if (data.success) {
                var TournamentContainer = $('#TournamentsList');
                var alreadyIn = false;
                TournamentContainer.empty();
                var friendsList = data.tourList;
                friendsList.forEach(function (list) {
                    if (list.me == list.id)
                        alreadyIn = true;
                });
                friendsList.forEach(function (list) {
                    var friendDiv =$('<li>' + list.name + ' <span style="font-weight: bold; font-size: 24px">(' + list.players + ' players) - <i>created by ' + list.creator + '</span></i></li>');
                    
                    if (list.me != list.id && !alreadyIn) {
                        var clickableRow = $('<button type="submit" style="margin-left: 25px;">Join</button>');
                        clickableRow.click(function () {
                            TournamentRegistration(list.id, true);
                            setTimeout(function() {
                                getTournamentList();
                            }, 300);
                        });
                    friendDiv.append(clickableRow[0]);
                    }
                    else if (list.me == list.id) {
                        var clickableRow = $('<button2 type="submit" style="margin-left: 25px;">Leave</button2>');
                        clickableRow.click(function (event) {
                            TournamentRegistration(list.id, false);
                            setTimeout(function() {
                                getTournamentList();
                            }, 300);
                        });
                    friendDiv.append(clickableRow[0]);
                    }

                    var MoreInfo = $('<button type="submit" style="margin-left: 30px;">More info</button>');
                    MoreInfo.click(function () {
                        TournamentInfo(list.id);
                    });
                    friendDiv.append(MoreInfo[0]);
                    TournamentContainer.append(friendDiv);
                });
            }
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Can\'t load tournament list.');
        }
    });
}

document.getElementById('JoinQueue').addEventListener('click', LaunchQueue);
document.getElementById('LeaveQueue').addEventListener('click', LeaveQueue);
document.getElementById('refreshTourList').addEventListener('click', getTournamentList);
document.getElementById('Tournament').addEventListener('click', getTournamentList);
