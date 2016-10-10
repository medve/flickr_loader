from img_loader_app.models import Photo
from rest_framework import serializers

class PhotoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    
    class Meta:
        model = Photo