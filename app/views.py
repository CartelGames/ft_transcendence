from django.db.models import Q
from django.shortcuts import render, redirect, get_object_or_404
from .forms import LoginForm, SignupForm, ProfilImgForm
from django.contrib.auth.models import AnonymousUser
from .models import UserProfil, Message, Game, Tournaments, TournamentsGame, MessageTournaments
from django.http import JsonResponse, Http404
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from app.consumer import MyConsumer
from asgiref.sync import async_to_sync
# Create your views here.


def UserLogin(request):
    if request.method == 'POST' and request.POST.get('type') == 'login':
        form = LoginForm(data=request.POST)
        if form.is_valid():
            form.is_bound = True
            username = form.fields['username'].clean(form.data.get('username'))
            password = form.fields['password'].clean(form.data.get('password'))
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({'success': True, 'errors': "<p>You are now logged in !</p>", 'goto': '#index', 'csrf_token': get_token(request)})
            else:
                return JsonResponse({'success': False, 'errors': "You are already log in !", 'csrf_token': get_token(request)})
        else:
            return JsonResponse({'success': False, 'errors': "Username or password incorrect.", 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def UserSignup(request):
    if request.method == 'POST' and request.POST.get('type') == 'signup':
        form = SignupForm(data=request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            pseudo = form.cleaned_data['pseudo']
            email = form.cleaned_data['email']
            password = form.cleaned_data['password1']
            user = UserProfil.objects.create_user(username=username, pseudo=pseudo, email=email, password=password)
            login(request, user)
            return JsonResponse({'success': True, 'errors': '<p>You are now registered !</p>', 'goto': '#index', 'csrf_token': get_token(request)})
        else:
            errors = '<br>'.join([error for field, errors in form.errors.items() for error in errors])
            return JsonResponse({'success': False, 'errors': errors, 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})


def UserLogout(request):
    if request.method == 'POST' and request.POST.get('type') == 'logout':
        if not isinstance(request.user, AnonymousUser):
            logout(request)
            return JsonResponse({'success': True, 'errors': 'You will be redirected in few seconds..', 'goto': '#index', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def UserProfilImg(request):
    if request.method == 'POST' and request.POST.get('type') == 'profilImg':
        form = ProfilImgForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            return JsonResponse({'success': True, 'errors': '', 'csrf_token': get_token(request)})
        else:
            errors = '<br>'.join([error for field, errors in form.errors.items() for error in errors])
            return JsonResponse({'success': False, 'errors': errors, 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def UserSendChat(request):
    if request.method == 'POST' and request.POST.get('type') == 'sendChat':
        id_to = request.POST.get('id_to', None)
        content = request.POST.get('content', None)
        if content and id_to:
            tournament = request.POST.get('tournament', None)
            if tournament:
                try:
                    tour = get_object_or_404(Tournaments, name=id_to)
                except Http404 as e:
                    return JsonResponse({'success': False, 'errors': 'Invalid pseudo', 'csrf_token': get_token(request)})
                new_message = MessageTournaments.objects.create(
                    id_from=request.user.id,
                    id_to=tour.id,
                    pseudo_from=request.user.pseudo,
                    pseudo_to=tour.name,
                    content=content
                )
            else:
                try:
                    friend = get_object_or_404(UserProfil, pseudo=id_to)
                except Http404 as e:
                    return JsonResponse({'success': False, 'errors': 'Invalid pseudo', 'csrf_token': get_token(request)})
                if request.user.blocked_friends.filter(id=friend.id).exists():
                    return JsonResponse({'success': False, 'errors': 'This user is blocked !', 'csrf_token': get_token(request)})
                new_message = Message.objects.create(
                    id_from=request.user.id,
                    id_to=friend.id,
                    pseudo_from=request.user.pseudo,
                    pseudo_to=friend.pseudo,
                    content=content
                )
            return JsonResponse({'success': True, 'errors': '', 'csrf_token': get_token(request)})
        else:
            return JsonResponse({'success': False, 'errors': 'Error', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def UserAddFriend(request):
    if request.method == 'POST' and request.POST.get('type') == 'addFriend':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'csrf_token': get_token(request)})
        friend_pseudo = request.POST.get('addfriendName')
        if friend_pseudo == request.user.pseudo:
            return JsonResponse({'success': False, 'errors': 'You can\'t add yourself !', 'csrf_token': get_token(request)})
        try:
            friend = get_object_or_404(UserProfil, pseudo=friend_pseudo)
        except Http404 as e:
                return JsonResponse({'success': False, 'errors': 'This user does not exist', 'csrf_token': get_token(request)})
        if request.user.friends.filter(id=friend.id).exists():
            if request.POST.get('delete') == 'true':
                request.user.remove_friend(friend)
                return JsonResponse({'success': True, 'errors': 'Friend deleted', 'csrf_token': get_token(request)})
            else:
                return JsonResponse({'success': False, 'errors': 'Already friends', 'csrf_token': get_token(request)})
        request.user.add_friend(friend)
        return JsonResponse({'success': True, 'errors': '<p>Friend added successfully</p>', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def UserBlockFriend(request):
    if request.method == 'POST' and request.POST.get('type') == 'blockFriend':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'csrf_token': get_token(request)})
        friend_pseudo = request.POST.get('blockFriendName')
        try:
            friend = get_object_or_404(UserProfil, pseudo=friend_pseudo)
        except Http404 as e:
                return JsonResponse({'success': False, 'errors': 'This user does not exist', 'csrf_token': get_token(request)})
        if request.user.friends.filter(id=friend.id).exists() or request.user.blocked_friends.filter(id=friend.id).exists():
                if request.POST.get('block') == 'true':
                    request.user.switch_blocked_friend(friend, True)
                    return JsonResponse({'success': True, 'errors': '<p>This friend is now blocked</p>', 'csrf_token': get_token(request)})
                else:
                    blocked_relationship = request.user.blocked_friends.through.objects.filter(from_userprofil=request.user, to_userprofil=friend)
                    if blocked_relationship.first().id % 2 == 0:
                        return JsonResponse({'success': False, 'errors': 'You can\'t unblock someone you didn\'t block yourself', 'csrf_token': get_token(request)})
                    request.user.switch_blocked_friend(friend, False)
                    return JsonResponse({'success': False, 'errors': '<p>This friend is now unblocked</p>', 'csrf_token': get_token(request)})
        else:
                return JsonResponse({'success': False, 'errors': 'This friend doesn\'t exist', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def CreateTournament(request):
    if request.method == 'POST' and request.POST.get('type') == 'createTour':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'csrf_token': get_token(request)})
        tourName = request.POST.get('tourName')
        exist_name = Tournaments.objects.filter(name=tourName)
        if exist_name:
            return JsonResponse({'success': False, 'errors': 'This tournament name is already exist !', 'csrf_token': get_token(request)})
        exist_id = Tournaments.objects.filter(creator=request.user.id).exclude(state=2)
        if exist_id:
            return JsonResponse({'success': False, 'errors': 'You have already a tournament in progress !', 'csrf_token': get_token(request)})
        new_tournament = Tournaments.objects.create(name=tourName, creator=request.user.id)
        new_tournament.add_player(UserProfil.objects.get(id=request.user.id))
        return JsonResponse({'success': True, 'errors': '<p>Tournament successfully created</p>', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def TournamentRegistration(request):
    if request.method == 'POST' and request.POST.get('type') == 'tourRegist':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'csrf_token': get_token(request)})
        
        exist_tour = Tournaments.objects.filter(id=request.POST.get('id')).first()
        if exist_tour:
            if exist_tour.state != 0:
                return JsonResponse({'success': False, 'errors': 'This tournament is already in progress !', 'csrf_token': get_token(request)})
            if request.POST.get('join') == 'true':
                exist_tour.add_player(UserProfil.objects.get(id=request.user.id))
                return JsonResponse({'success': True, 'errors': '', 'csrf_token': get_token(request)})
            else:
                exist_tour.remove_player(UserProfil.objects.get(id=request.user.id))
                return JsonResponse({'success': True, 'errors': '', 'csrf_token': get_token(request)})
        else:
            return JsonResponse({'success': False, 'errors': 'This tournament does not exist !', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def TournamentUpdate(request):
    if request.method == 'POST' and request.POST.get('type') == 'tourUpdate':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'csrf_token': get_token(request)})
        exist_tour = Tournaments.objects.filter(id=request.POST.get('id')).first()
        if exist_tour:
            if exist_tour.creator != request.user.id:
                return JsonResponse({'success': False, 'errors': 'You are not the creator !', 'csrf_token': get_token(request)})
            if request.POST.get('statut') == 'start':
                players_count = exist_tour.players.count()
                if players_count < 2:
                    return JsonResponse({'success': False, 'errors': 'You need atleast 2 players', 'csrf_token': get_token(request)})
                if not players_count & 1 == 0:
                    return JsonResponse({'success': False, 'errors': 'You need to have ² players (2/4/8/16/32...)', 'csrf_token': get_token(request)})
                phase = 0
                while players_count > 2:
                    players_count /= 2
                    phase += 1
                calc_phase = phase
                while calc_phase >= 0:
                    matchs = calc_phase * 2
                    while matchs > 0 or calc_phase == 0:
                        new_tour = TournamentsGame.objects.create(tournament_id=exist_tour.id, phase=calc_phase)
                        new_match = Game.objects.create(tournament=new_tour.id)
                        new_tour.set_match(new_match.id)
                        matchs -= 1
                        if calc_phase == 0:
                            calc_phase -= 1
                    calc_phase -= 1
                players = exist_tour.players.all()
                i = 0
                while i < exist_tour.players.count():
                    find_tour = TournamentsGame.objects.filter(tournament_id=exist_tour.id, state=0).first()
                    find_match = Game.objects.filter(id=find_tour.game_id).first()
                    find_match.set_players(players[i].id,  players[i + 1].id, 1)
                    find_tour.set_state(1)
                    i += 2
                exist_tour.update_state(1)
                first_game = TournamentsGame.objects.filter(tournament_id=exist_tour.id, phase=phase, state=1).first()
                first_game.set_state(2)
                game = Game.objects.get(id=first_game.game_id)
                new_message = MessageTournaments.objects.create(
                    id_from='0',
                    id_to=exist_tour.id,
                    pseudo_from='Server',
                    pseudo_to=exist_tour.name,
                    content='The tournament is launched ! First match is ' + UserProfil.objects.get(id=game.player1).pseudo + ' VS ' + UserProfil.objects.get(id=game.player2).pseudo + ' !'
                )
                for player in players:
                    async_to_sync(MyConsumer.send_message_to_user)(player.pseudo)
                return JsonResponse({'success': True, 'errors': '', 'csrf_token': get_token(request)})
            elif request.POST.get('statut') == 'delete':
                exist_tour.clear_players()
                exist_tour.delete()
                return JsonResponse({'success': True, 'errors': '', 'csrf_token': get_token(request)})
        else:
            return JsonResponse({'success': False, 'errors': 'This tournament does not exist !', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def GetProfil(request):
    if request.method == 'GET':
        if (isinstance(request.user, AnonymousUser) == False):
            users_list = [{'id': request.user.id, 'pseudo': request.user.pseudo}]
            return JsonResponse({'success': True, 'users': users_list, 'username': request.user.username, 'pseudo': request.user.pseudo, 'email': request.user.email, 'img': request.user.profil_img.url, 'csrf_token': get_token(request)})
        else:
            return JsonResponse({'success': False, 'username': '', 'email': '', 'img': '', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def GetChat(request):
    if request.method == 'GET':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'csrf_token': get_token(request)})
        messages_sent = Message.objects.filter(id_from=request.user.id)
        messages_received = Message.objects.filter(id_to=request.user.id)
        messages = messages_sent | messages_received
        messages = messages.order_by('timestamp')
        messages_list = [{'content': msg.content, 'timestamp': msg.timestamp, 'me': request.user.pseudo, 'pseudo_from': msg.pseudo_from, 'pseudo_to': msg.pseudo_to} for msg in messages]
        if request.user.tournament != 0:
            messages_tour = MessageTournaments.objects.filter(id_to=request.user.tournament)
            messages_tour = messages_tour.order_by('timestamp')
            messages_list_tour = [{'content': msg.content, 'timestamp': msg.timestamp, 'me': request.user.pseudo, 'pseudo_from': msg.pseudo_from, 'pseudo_to': msg.pseudo_to} for msg in messages_tour]
            return JsonResponse({'success': True,  'messages': messages_list, 'message_tour': messages_list_tour, 'csrf_token': get_token(request)})
        return JsonResponse({'success': True,  'messages': messages_list, 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def GetFriends(request):
    if request.method == 'GET':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'csrf_token': get_token(request)})
        try:
            user_id = request.user.id
            user = UserProfil.objects.get(id=user_id)
            friends = user.friends.all()
            friends_list = [{'pseudo': friend.pseudo} for friend in friends]
            return JsonResponse({'success': True, 'friends': friends_list, 'csrf_token': get_token(request)})
        except UserProfil.DoesNotExist:
            return JsonResponse({'success': False, 'friends': 'User not found', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def GetBlockedFriends(request):
    if request.method == 'GET':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'csrf_token': get_token(request)})
        try:
            user_id = request.user.id
            user = UserProfil.objects.get(id=user_id)
            friends = user.blocked_friends.all()
            friends_list = [{'pseudo': friend.pseudo} for friend in friends]
            return JsonResponse({'success': True, 'friends': friends_list, 'csrf_token': get_token(request)})
        except UserProfil.DoesNotExist:
            return JsonResponse({'success': False, 'friends': 'User not found', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def LoadStats(request):
    if request.method == 'PUT':
        new_Stats = UserProfil.objects.all()
        for usr in new_Stats:
            games_played = Game.objects.filter((Q(player1=usr.id) | Q(player2=usr.id) | Q(player3=usr.id) | Q(player4=usr.id)) & Q(ended=True)).count()
            usr.nb_games = games_played
            winned_games = Game.objects.filter(winner=usr.id).count()
            if games_played != 0:
                usr.mmr =  winned_games / games_played * 100
            usr.save()
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            games_played = data.get('games_played')

            user = UserProfil.objects.get(id=user_id)
            user.nb_games += games_played
            user.save()

            return JsonResponse({'success': True, 'message': 'Number of games updated successfully.', 'csrf_token': get_token(request)})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e), 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method.', 'csrf_token': get_token(request)})

def GetStats(request):
    if request.method == 'GET':
        new_Stats = UserProfil.objects.all()
        users_list = [{'id': usr.id, 'email': usr.email, 'username': usr.username, 'pseudo': usr.pseudo, 'img': usr.profil_img.url, 'nb_game': usr.nb_games, 'mmr': usr.mmr} for usr in new_Stats]
        return JsonResponse({'success': True,  'users': users_list, 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def GetTournamentList(request):
    if request.method == 'GET':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'csrf_token': get_token(request)})
        tournaments = Tournaments.objects.filter(ended=False)
        tournaments = tournaments.order_by('state')
        tourList = [{'id': tourn.id, 'name': tourn.name, 'creator':  UserProfil.objects.get(id=tourn.creator).pseudo, 'players': tourn.players.count(), 'state': tourn.state, 'me': request.user.tournament} for tourn in tournaments]
        return JsonResponse({'success': True, 'tourList': tourList, 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def GetTournamentInfo(request):
    if request.method == 'GET':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'csrf_token': get_token(request)})
        tournament = Tournaments.objects.filter(id=request.GET.get('id')).first()
        print(request.GET.get('id'))
        if tournament:
            players = tournament.players.all()
            players_list = [{'pseudo': player.pseudo} for player in players]
            tourList = [{'id': tournament.id, 'name': tournament.name, 'creator':  UserProfil.objects.get(id=tournament.creator).pseudo, 'players': tournament.players.count(), 'state': tournament.state}]
            tournament_games = TournamentsGame.objects.filter(tournament_id=tournament.id)
            games = []
            for match in tournament_games:
                game = Game.objects.filter(tournament=match.id).first()
                if game:
                    player1_profile = UserProfil.objects.filter(id=game.player1).first()
                    player2_profile = UserProfil.objects.filter(id=game.player2).first()
                    if player1_profile and player2_profile:
                        if game.winner != 0:
                            games.append({'id': game.id, 'p1': UserProfil.objects.get(id=game.player1).pseudo, 'p2': UserProfil.objects.get(id=game.player2).pseudo, 'state': match.state, 'phase': match.phase, 'winner': UserProfil.objects.get(id=game.winner).pseudo})
                        else:
                            games.append({'id': game.id, 'p1': UserProfil.objects.get(id=game.player1).pseudo, 'p2': UserProfil.objects.get(id=game.player2).pseudo, 'state': match.state, 'phase': match.phase, 'winner': 0})
            return JsonResponse({'success': True, 'tourList': tourList, 'player': players_list, 'games': games, 'owner': tournament.creator == request.user.id, 'csrf_token': get_token(request)})
        else:
            return JsonResponse({'success': False, 'errors': 'Wrong tournament id !', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})
   
def index(request):
    return render(request, 'index.html')
