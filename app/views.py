from django.shortcuts import render, redirect, get_object_or_404
from .forms import LoginForm, SignupForm, ProfilImgForm
from django.contrib.auth.models import AnonymousUser
from .models import UserProfil, Message
from django.http import JsonResponse, Http404
from django.contrib.auth import authenticate, login, logout
from django.middleware import csrf
from django.views.decorators.csrf import csrf_exempt
# Create your views here.


@csrf_exempt
def index(request):
    if request.method == 'POST':
        if request.POST.get('type') == 'login':
            form = LoginForm(data=request.POST)
            if form.is_valid():
                form.is_bound = True
                username = form.fields['username'].clean(form.data.get('username'))
                password = form.fields['password'].clean(form.data.get('password'))
                user = authenticate(request, username=username, password=password)
                if user is not None:
                    login(request, user)
                    return JsonResponse({'success': True, 'errors': "<p>You are now logged in !</p>", 'goto': '#index'})
                else:
                    return JsonResponse({'success': False, 'errors': "You are already log in !"})
            else:
                return JsonResponse({'success': False, 'errors': "Username or password incorrect."})
        elif request.POST.get('type') == 'signup':
            form = SignupForm(data=request.POST)
            if form.is_valid():
                username = form.cleaned_data['username']
                pseudo = form.cleaned_data['pseudo']
                email = form.cleaned_data['email']
                password = form.cleaned_data['password1']
                user = UserProfil.objects.create_user(username=username, pseudo=pseudo, email=email, password=password)
                login(request, user)
                return JsonResponse({'success': True, 'errors': '<p>You are now registered !</p>', 'goto': '#index'})
            else:
                errors = '<br>'.join([error for field, errors in form.errors.items() for error in errors])
                return JsonResponse({'success': False, 'errors': errors})
        elif request.POST.get('type') == 'logout':
                if request.user is not None:
                    logout(request)
                    return JsonResponse({'success': True, 'errors': 'You will be redirected in few seconds..', 'goto': '#index'})
        elif request.POST.get('type') == 'profilImg':
            form = ProfilImgForm(request.POST, request.FILES, instance=request.user)
            if form.is_valid():
                form.save()
                return JsonResponse({'success': True, 'errors': ''})
            else:
                errors = '<br>'.join([error for field, errors in form.errors.items() for error in errors])
                return JsonResponse({'success': False, 'errors': errors})
        elif request.POST.get('type') == 'sendChat':
            content = request.POST.get('content', None)
            id_to = request.POST.get('id_to', None)
            if content and id_to:
                try:
                    friend = get_object_or_404(UserProfil, pseudo=id_to)
                except Http404 as e:
                    return JsonResponse({'success': False, 'errors': 'Invalid pseudo'})
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
                return JsonResponse({'success': True, 'errors': ''})
            else:
                return JsonResponse({'success': False, 'errors': 'Error'})
        elif request.POST.get('type') == 'addFriend':
            if isinstance(request.user, AnonymousUser):
                return JsonResponse({'success': False})
            friend_pseudo = request.POST.get('add-friend-name')
            if friend_pseudo == request.user.pseudo:
                return JsonResponse({'success': False, 'errors': 'You can\'t add yourself !'})
            try:
                friend = get_object_or_404(UserProfil, pseudo=friend_pseudo)
            except Http404 as e:
                    return JsonResponse({'success': False, 'errors': 'This user does not exist'})
            if request.user.friends.filter(id=friend.id).exists():
                    return JsonResponse({'success': False, 'errors': 'Already friends'})
            request.user.add_friend(friend)
            return JsonResponse({'success': True, 'errors': '<p>Friend added successfully</p>'})
        else:
            return JsonResponse({'success': False, 'errors': 'An error occured with the type of post.'})
    elif request.method == 'GET':
        if request.GET.get('data') == 'profil':
            if request.user is not None:
                return JsonResponse({'success': True, 'username': request.user.username, 'pseudo': request.user.pseudo, 'email': request.user.email, 'img': request.user.profil_img.url})
            else:
                return JsonResponse({'success': True, 'username': '', 'email': '', 'img': ''})
        elif request.GET.get('data') == 'csrftoken':
            return JsonResponse({'csrftoken': csrf.get_token(request)})
        elif request.GET.get('data') == 'chat':
            if isinstance(request.user, AnonymousUser):
                return JsonResponse({'success': False})
            messages_sent = Message.objects.filter(id_from=request.user.id)
            messages_received = Message.objects.filter(id_to=request.user.id)
            messages = messages_sent | messages_received
            messages = messages.order_by('timestamp')
            messages_list = [{'content': msg.content, 'timestamp': msg.timestamp, 'me': request.user.pseudo, 'pseudo_from': msg.pseudo_from, 'pseudo_to': msg.pseudo_to} for msg in messages]
            return JsonResponse({'success': True,  'messages': messages_list})
        elif request.GET.get('data') == 'friends':
            if isinstance(request.user, AnonymousUser):
                return JsonResponse({'success': False})
            try:
                user_id = request.user.id
                user = UserProfil.objects.get(id=user_id)
                friends = user.friends.all()
                friends_list = [{'pseudo': friend.pseudo} for friend in friends]
                return JsonResponse({'success': True, 'friends': friends_list})
            except UserProfil.DoesNotExist:
                return JsonResponse({'success': False, 'friends': 'User not found'})
        elif request.GET.get('data') == 'stats':
            new_Stats = UserProfil.objects.all()
            users_list = [{'id': usr.id, 'pseudo': usr.pseudo, 'img': usr.profil_img.url, 'nb_game': usr.nb_games, 'mmr': usr.mmr} for usr in new_Stats]
            return JsonResponse({'success': True,  'users': users_list})
        else:
            form = LoginForm()
    else:
        form = LoginForm()
    return render(request, 'index.html', {'form': form})
