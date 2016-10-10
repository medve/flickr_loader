from django.shortcuts import render
from img_loader_app.models import Photo
from img_loader_app.serializers import PhotoSerializer
from rest_framework import views
from django.views.generic import TemplateView
from rest_framework.response import Response
from rest_framework import status

class ShowMap(TemplateView):
    template_name = "map.html"


class SavePhoto(views.APIView):

    def get(self, request, format=None):
        snippets = Photo.objects.all()
        serializer = PhotoSerializer(snippets, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        serializer = PhotoSerializer(data=request.data, many=True)
        if serializer.is_valid(): 
            serializer.save()
            return Response(serializer.data, 
                              status=status.HTTP_201_CREATED)
        return Response(serializer.errors, 
                          status=status.HTTP_400_BAD_REQUEST)