from django.conf.urls import url
from img_loader_app.views import ShowMap,SavePhoto

urlpatterns = [
	url(r'^search/$', ShowMap.as_view(), name='map'),
	url(r'^save/$', SavePhoto.as_view(), name='save'),
]