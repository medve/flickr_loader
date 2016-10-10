from django.conf.urls import url, include
from django.contrib import admin
import img_loader_app

urlpatterns = [
    url(r'^map/', include('img_loader_app.urls')),

    url(r'^admin/', admin.site.urls),
]
