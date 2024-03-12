from django.shortcuts import render, redirect
from .forms import LoginForm, SignupForm, ProfilImgForm
from .models import UserProfil
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
# Create your views here.

def index(request):
    if request.method == 'POST':
        if request.POST.get('type') == 'login':
            form = LoginForm(data=request.POST)
            if form.is_valid():
                print('Formulaire valide')
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
            print(request.POST)
            form = SignupForm(data=request.POST)
            if form.is_valid():
                print('Formulaire valide')
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
                print('error', form.errors)
                errors = '<br>'.join([error for field, errors in form.errors.items() for error in errors])
                return JsonResponse({'success': False, 'errors': errors})
        else:
            return JsonResponse({'success': False, 'errors': 'An error occured with the type of post.'})
    elif request.method == 'GET':
        if request.GET.get('data') == 'profil':
            if request.user is not None:
                return JsonResponse({'success': True, 'username': request.user.username, 'email': request.user.email, 'img': request.user.profil_img.url})
            else:
                return JsonResponse({'success': True, 'username': '', 'email': '', 'img': ''})

        else:
            form = LoginForm()
    else:
        form = LoginForm()
    return render(request, 'index.html', {'form': form})
