from django.shortcuts import render, redirect, get_object_or_404
from .forms import LoginForm, SignupForm, ProfilImgForm
from django.contrib.auth.models import AnonymousUser
from .models import UserProfil, Message, Game
from django.http import JsonResponse, Http404
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from app.consumer import MyConsumer
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
            sender_info = {
                'id_from': new_message.id_from,
                'username': request.user.username,
                'email': request.user.email,
            }
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

def GetProfil(request):
    if request.method == 'GET':
        if request.user is not None:
            users_list = [{'id': request.user.id, 'pseudo': request.user.pseudo}]
            return JsonResponse({'success': True, 'users': users_list, 'username': request.user.username, 'pseudo': request.user.pseudo, 'email': request.user.email, 'img': request.user.profil_img.url, 'csrf_token': get_token(request)})
        else:
            return JsonResponse({'success': True, 'username': '', 'email': '', 'img': '', 'csrf_token': get_token(request)})
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

def GetStats(request):
    if request.method == 'GET':
        new_Stats = UserProfil.objects.all()
        users_list = [{'id': usr.id, 'pseudo': usr.pseudo, 'img': usr.profil_img.url, 'nb_game': usr.nb_games, 'mmr': usr.mmr} for usr in new_Stats]
        return JsonResponse({'success': True,  'users': users_list, 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})

def NewGame(request):
    if request.method == 'POST' and request.POST.get('type') == 'newGame':
        if isinstance(request.user, AnonymousUser):
            return JsonResponse({'success': False, 'errors': 'You\'re not logged out !', 'csrf_token': get_token(request)})
        player1 = int(request.POST.get('player1'))
        
        if player1 == request.user.id:
            try:
                player1 = get_object_or_404(UserProfil, id=player1)
            except Http404 as e:
                    return JsonResponse({'success': False, 'errors': 'This user does not exist', 'csrf_token': get_token(request)})
        else:
            return JsonResponse({'success': False, 'errors': 'You\'re not logged in !', 'csrf_token': get_token(request)})
        if request.POST.get('player2') is not None:
            try:
                player2 = get_object_or_404(UserProfil, id=request.POST.get('player2'))
            except Http404 as e:
                    return JsonResponse({'success': False, 'errors': 'This user does not exist', 'csrf_token': get_token(request)})
            player2.nb_games += 1
        player2 = player1
        player1.nb_games += 1
        if request.POST.get('winner') == 'player1':
            player1.mmr += 10
            player2.mmr -= 10
        elif request.POST.get('winner') == 'player2':
            player1.mmr -= 10
            player2.mmr += 10
        else:
            player1.mmr -= 5
        new_game = Game.objects.create(
            player1=request.user.id,
            player2=player2.id,
            pseudo_p1=request.user.pseudo,
            pseudo_p2=player2.pseudo,
            winner=request.POST.get('winner')
        )
        return JsonResponse({'success': True, 'errors': 'The stats game was correctly created !', 'csrf_token': get_token(request)})
    else:
        return JsonResponse({'success': False, 'errors': "Invalid request.", 'csrf_token': get_token(request)})
   
def index(request):
    return render(request, 'index.html')
