from django.shortcuts import render
from .forms import LoginForm
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
# Create your views here.

def index(request):
    if request.method == 'POST':
        print('Avant l\'instanciation du formulaire')
        print(request.POST)
        form = LoginForm(data=request.POST)
        # if form.is_valid():
        print('Formulaire valide')
        form.is_bound = True
        username = form.fields['username'].clean(form.data.get('username'))
        password = form.fields['password'].clean(form.data.get('password'))
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'success': True})
        else:
            form.add_error(None, 'Nom d\'utilisateur ou mot de passe incorrect.')
            errors = '\n'.join([error for error in form.non_field_errors()])
            return JsonResponse({'success': False, 'errors': errors})
        # else:
        #     print('erreur : ', request.POST)
        #     errors = '\n'.join([error for error in form.non_field_errors()])
        #     return JsonResponse({'success': False, 'errors': errors})
    else:
        form = LoginForm()

    return render(request, 'index.html', {'form': form})