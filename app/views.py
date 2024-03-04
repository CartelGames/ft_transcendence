from django.shortcuts import render
from .forms import LoginForm, SignupForm
from .models import UserProfil
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
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
                    return JsonResponse({'success': True, 'errors': "<p>You are now log in !</p>", 'goto': '#index'})
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
                user = UserProfil.objects.create_user(username=username, email=email, password=password)
                login(request, user)
                return JsonResponse({'success': True, 'errors': '<p>You are now registered !</p>', 'goto': '#login'})
            else:
                errors = '<br>'.join([error for field, errors in form.errors.items() for error in errors])
                return JsonResponse({'success': False, 'errors': errors})
        else:
            return JsonResponse({'success': False, 'errors': 'An error occured with the type of post.'})

    else:
        form = LoginForm()

    return render(request, 'index.html', {'form': form})