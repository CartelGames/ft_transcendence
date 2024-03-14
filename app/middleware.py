from django.middleware.csrf import CsrfViewMiddleware

class CustomCsrfViewMiddleware(CsrfViewMiddleware):
    def process_view(self, request, callback, callback_args, callback_kwargs):
        if getattr(callback, 'csrf_exempt', False) and request.POST.get('type') == 'sendChat':
            return None
        return super().process_view(request, callback, callback_args, callback_kwargs)