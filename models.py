from datetime import datetime
from django.db import models


class User(models.Model):
    user_name = models.CharField(max_length=200)
    user_sector = models.CharField(max_length=20)
    user_funtion = models.CharField(max_length=20)
    user_username = models.CharField(max_length=30)
    user_password = models.CharField(max_length=30)
    picture = models.FileField(null=True, blank=True)

class Checklist(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=30)
    version = models.CharField(max_length=30)
    user_id = models.IntegerField(default=1)
    creation_date = models.DateField(auto_now_add=True)
    old_version = models.BooleanField(default=0)
    good_practices = models.BooleanField(default=0)

class Step(models.Model):
    checklist = models.ForeignKey(Checklist)
    step_order = models.IntegerField(default=0)
    text = models.CharField(max_length=500)
    input_type = models.CharField(max_length=100)
    grand = models.CharField(max_length=20)
    max_value = models.FloatField(default=0.0)
    min_value = models.FloatField(default=0.0)
    observation = models.CharField(max_length=1000)

class Checkout(models.Model):
    client = models.CharField(max_length=200)
    creation_dateTime = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User)
    note = models.CharField(max_length=10)

class Test(models.Model):
    checklist = models.ForeignKey(Checklist)
    checkout = models.ForeignKey(Checkout)
    serial_number = models.IntegerField()
    creation_date = models.DateField(auto_now_add=True)
    finish_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=50)
    committed = models.CharField(max_length=50, default='-1')
    hex_serial_number = models.BooleanField(default=0)
    good_practices_version = models.CharField(max_length=50)

class Result(models.Model):
    step = models.ForeignKey(Step)
    test = models.ForeignKey(Test)
    user_id = models.CharField(max_length=200)
    success = models.BooleanField(default=0)
    result = models.FloatField(default=0)
    text_result = models.CharField(max_length=200)
    finish_dateTime = models.DateTimeField(auto_now_add=True)

class RedCard(models.Model):
    step = models.ForeignKey(Step, null=False)
    test = models.ForeignKey(Test, null=False)
    data = models.DateField(auto_now_add=True)
    description = models.CharField(max_length=200)
    cause = models.CharField(max_length=200)
    time = models.CharField(max_length=200)
    custs = models.CharField(max_length=200)
    status = models.CharField(max_length=50)

class Login(models.Model):
    user = models.ForeignKey(User)
    last_activity = models.DateTimeField(auto_now_add=True)
    logged = models.BooleanField(default=0)


