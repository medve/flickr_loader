from django.db import models


class Photo(models.Model):
    owner = models.CharField(max_length=150, db_index=True,blank=True)
    secret = models.CharField(max_length=150,blank=True)
    server = models.CharField(max_length=50,blank=True)
    farm = models.CharField(max_length=50,blank=True)
    title = models.CharField(max_length=150,blank=True)
    ispublic = models.BooleanField(blank=True)
    isfriend = models.BooleanField(blank=True)
    isfamily = models.BooleanField(blank=True)


    class Meta:
        verbose_name = "Фото"
        verbose_name_plural = "Фото"

    def __str__(self):
        return "%s %s"%(str(self.id), self.owner)
    
