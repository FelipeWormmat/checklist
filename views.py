from django.shortcuts import render, get_object_or_404
from django.core import serializers
from django.http import HttpResponse
from django.http import JsonResponse
from django.core.paginator import Paginator
# import sgp.models
from django.db import connection
import json
import datetime
import string
import re
import itertools
from django.views.decorators.csrf import csrf_exempt
from .models import User, Step
from .models import Checklist, Test, Result, Login, Checkout, RedCard
from django.db.models import Q

# Test

def dump(obj):
  '''return a printable representation of an object for debugging'''
  newobj=obj
  if '__dict__' in dir(obj):
    newobj=obj.__dict__
    if ' object at ' in str(obj) and not newobj.has_key('__type__'):
      newobj['__type__']=str(obj)
    for attr in newobj:
      newobj[attr]=dump(newobj[attr])
  return newobj

# end of Test

def index(request): # load login page
    return render(request, 'checklist_site/login.html')

def dashboard(request):
    return render(request, 'menu.html')

def ch_dashboard(request):
    return render(request, 'checklist_site/dashboard.html')


def users(request):
    return render(request, 'users.html')


def checklists(request):
    return render(request, 'checklist_site/checklists.html')

def test(request, test_id):
    return render(request, 'checklist_site/test.html', {'test_id':test_id})

def tests(request):
    return render(request, 'checklist_site/tests.html')

def checkout(request):
    return render(request, 'checklist_site/checkout.html')

def reports(request):
    return render(request, 'checklist_site/reports.html')

def red_cards(request):
    return render(request, 'checklist_site/redcard.html')

def boas_praticas(request):
    return render(request, 'checklist_site/boas_praticas.html')    

def users_get_all(request):
    users = User.objects.all()
    data = serializers.serialize("json", users)
    return HttpResponse(data)

def user_edit_get(request, user_id):
    user = get_object_or_404(User, pk=user_id)
    data = serializers.serialize("json", [user])
    return HttpResponse(data)

def user_save(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)
    user = User()
    user.user_id = data['user']['user_id']
    user.user_name = data['user']['user_name']
    user.user_sector = data['user']['user_sector']
    user.user_funtion = data['user']['user_function']
    user.user_username = data['user']['user_username']
    user.user_password = data['user']['user_password']
    user.picture = data['user']['picture']

    if user.user_id > 0:
        user_db = get_object_or_404(User, pk=user.user_id)

        user_db.user_name = user.user_name
        user_db.user_sector = user.user_sector
        user_db.user_funtion = user.user_funtion
        user_db.user_username = user.user_username
        user_db.user_password = user.user_password
        user_db.picture = user.picture
        user_db.save()
    else:
        user.save()

    return render(request, 'users.html')

def user_delete(request, user_id):
    userToDelete = User.objects.get(pk=user_id)
    userToDelete.delete()

    return render(request, 'users.html')

def checklists_get_all(request):
    checklists = Checklist.objects.all()
    data = serializers.serialize("json", checklists)
    return HttpResponse(data)

def checklists_get_new_versions(request):
    checklists = Checklist.objects.all()
    for checklist in checklists:
        if checklist.old_version == True:
            checklist.delete()
    data = serializers.serialize("json", checklists)
    return HttpResponse(data)

@csrf_exempt
def get_automatic_steps(request):

    is_update = 0
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)
    print("daaaata",data)
    if re.search('[a-fA-F]',data['serial_number']):
        serial_number = int(data['serial_number'].lower(),16)
        is_serial_number_hex = 1
    else:
        serial_number = data['serial_number']
        is_serial_number_hex = 0
    checklists = Checklist.objects.filter(code=data['checklist_code'])
    test_filtered = []
    for c in checklists:
        print c
        if len(test_filtered) < 1:
            test_filtered = Test.objects.filter(checklist=c, serial_number=serial_number, hex_serial_number=is_serial_number_hex)
            print c.version
        checklist = c
    test = Test()

    if len(test_filtered) > 0:
        test = test_filtered[0]
        is_update = 1

    if is_update == 0:
        test.status = "Novo"
        test.hex_serial_number = is_serial_number_hex
        test.serial_number = serial_number
        test.checklist = checklist
        steps = Step.objects.filter(checklist_id=test.checklist)

        test.save()

        for step in steps:
            result = Result()
            result.step = step
            result.test = test
            result.user = '0'
            result.save()

    steps = Step.objects.filter(checklist_id=test.checklist, input_type="Valor")
    results = []
    for step in steps:
        if (step.input_type == "Valor"):
            step_temp = {}
            step_temp["id"] = step.id
            step_temp["text"] = step.text
            step_temp["min_value"] = step.min_value
            step_temp["max_value"] = step.max_value
            step_temp["observation"] = step.observation
            step_temp["grand"] = step.grand
            results.append(step_temp)
    
    data = {}
    data["steps"] = results 

    return JsonResponse(data)

@csrf_exempt
def save_automatic_steps(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)
    user = get_object_or_404(User,user_username=data['user'])
    print('user',user.__dict__)
    
    if re.search('[a-fA-F]',data['serial_number']):
        serial_number = int(data['serial_number'].lower(),16)
        is_serial_number_hex = 1
    else:
        serial_number = data['serial_number']
        is_serial_number_hex = 0
    checklists = Checklist.objects.filter(code=data['checklist_code'])
    test_filtered = []
    for c in checklists:
        if len(test_filtered) < 1:
            test_filtered = Test.objects.filter(checklist=c, serial_number=serial_number, hex_serial_number=is_serial_number_hex)
        checklist = c
    

    if len(test_filtered) > 0:
        test = test_filtered[0]

    for result in data['results']:
        r = get_object_or_404(Result, step=result['id'], test=test_filtered[0].id)
        r.result = result['value']
        r.user_id = user.pk
        r.success = True
        r.save()

    data = {}
    data['result'] = 'ok'
    return JsonResponse(data)

def checklists_get_all_with_paginator(request, page):
    checklists_list = Checklist.objects.all().order_by('-code')
    paginator = Paginator(checklists_list, 20) # show 10 objects per page

    # Make sure page request is an int. If not, deliver first page.
    try:
        page = int(page)
    except ValueError:
        page = 1
    try:
        checklists = paginator.page(page)
    except:
        checklists = paginator.page(paginator.num_pages)

    data = serializers.serialize("json", checklists)
    result = {}
    result['checklists'] = data
    result['num_pages'] = paginator.num_pages
    print result['checklists']
    return HttpResponse(json.dumps(result))


def checklists_get_with_filters(request, page, showOldVersions, filterText=''):

    text = filterText.replace('_',' ')
    print text

    if filterText != '':
        if showOldVersions == 'true':
            checklists_list = Checklist.objects.all().filter(Q(name__icontains=filterText) | Q(code__icontains=filterText)).extra(select={'code': 'CAST(code AS SIGNED INTEGER)'}).order_by('-code')
        else:
            checklists_list = Checklist.objects.exclude(old_version=True).filter(Q(name__icontains=text) | Q(code__icontains=text)).order_by('-code')
    else:
        if showOldVersions == 'true':
            checklists_list = Checklist.objects.all().filter(Q(name__icontains=filterText) | Q(code__contains=filterText)).order_by('-code')
        else:
            checklists_list = Checklist.objects.exclude(old_version=True).filter(Q(name__icontains=filterText) | Q(code__contains=filterText)).extra(select={'code': 'CAST(code AS SIGNED INTEGER)'}).order_by('-code')

    paginator = Paginator(checklists_list, 20) # show 20 objects per page

    # Make sure page request is an int. If not, deliver first page.
    try:
        page = int(page)
    except ValueError:
        page = 1

    try:
        checklists = paginator.page(page)
    except:
        checklists = paginator.page(paginator.num_pages)

    data = serializers.serialize("json", checklists)
    result = {}
    result['checklists'] = data
    result['num_pages'] = paginator.num_pages
    # print result['checklists']
    return HttpResponse(json.dumps(result))

def checklists_get_new_versions_with_paginator(request, page):
    checklists_list = Checklist.objects.exclude(old_version=True)


    paginator = Paginator(checklists_list, 20) # show 10 objects per page

    # Make sure page request is an int. If not, deliver first page.
    try:
        page = int(page)
    except ValueError:
        page = 1

    try:
        checklists = paginator.page(page)
    except:
        checklists = paginator.page(paginator.num_pages)

    data = serializers.serialize("json", checklists)
    result = {}
    result['checklists'] = data
    result['num_pages'] = paginator.num_pages
    return HttpResponse(json.dumps(result))

def checklist_get_by_code(request, checklist_code):
    checklist = get_object_or_404(Checklist, code=checklist_code, old_version=0)
    data = serializers.serialize("json", [checklist])

    return HttpResponse(data)

def checklist_edit_get(request, checklist_id):
    checklist = get_object_or_404(Checklist, pk=checklist_id)
    data = serializers.serialize("json", [checklist])
    return HttpResponse(data)

def steps_edit_get(request, checklist_id):
    steps = Step.objects.all().filter(checklist_id=checklist_id)
    data = serializers.serialize("json", steps)
    return HttpResponse(data)

def checklist_delete(request, checklist_id):
    checklistToDelete = Checklist.objects.get(pk=checklist_id)
    checklistToDelete.delete()

    return render(request,'checklist_site/checklists.html')

def checklist_save(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    checkl = Checklist()
    checkl.name = data['checklist']['name']
    checkl.code = data['checklist']['code']
    checkl.version = data['checklist']['version']
    checkl.user_id = data['checklist']['user_id']
    checkl.creation_date = data['checklist']['creation_date']
    checkl.good_practices = data['checklist']['goodPractices']

    # set the other checklists as old versions
    checklists = Checklist.objects.all()

    for i in range(0, len(checklists)):
        if checklists[i].code == checkl.code:
            checklists[i].old_version = True
            checklists[i].save()

    checkl.save()

    ck = get_object_or_404(Checklist, name=checkl.name, version=checkl.version, code=checkl.code)

    steps = Step.objects.all().filter(checklist_id=ck)

    for i in range(0, len(data['steps'])):
        step = Step()
        step.checklist = ck
        step.text = data['steps'][i]['text']
        step.step_order = data['steps'][i]['step_order']
        step.input_type = data['steps'][i]['input_type']
        step.grand = data['steps'][i]['grand']
        step.max_value = data['steps'][i]['max_value']
        step.min_value = data['steps'][i]['min_value']
        step.observation = data['steps'][i]['observation']
        step.save()

    return render(request, 'checklist_site/checklists.html')

def test_delete(request, test_id):
    test = get_object_or_404(Test, pk=test_id)
    tests = Test.objects.all().filter(committed=test.id)

    for i in range(len(tests)):
        tests[i].committed = -1
        tests[i].save()

    test.delete()

    return render(request, 'checklist_site/tests.html')

def test_save2(request):
    is_update = 0
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)
    if re.search('[a-fA-F]',data['test']['serial_number']):
        serial_number = int(data['test']['serial_number'].lower(),16)
        is_serial_number_hex = 1
    else:
        serial_number = data['test']['serial_number']
        is_serial_number_hex = 0
    checklist = Checklist.objects.filter(code=data['test']['checklist_code']).latest("version")
    print checklist.version
    tests = Test.objects.filter(checklist=checklist, serial_number=serial_number, hex_serial_number=is_serial_number_hex)
    test = Test()
    if len(tests) > 0:
        test = tests[0]
        is_update = 1

    if is_update == 0:
        print "novo"
        test.status = "Novo"
        test.hex_serial_number = is_serial_number_hex
        test.serial_number = serial_number
        test.checklist = checklist
        steps = Step.objects.filter(checklist_id=test.checklist)


        test.save()

        for step in steps:
            result = Result()
            result.step = step
            result.test = test
            result.user = '0'
            result.save()

    data_test = serializers.serialize("json", [test])
    print data_test

    return HttpResponse(data_test, 'checklist_site/test.html')

def test_save(request):
    is_update = 0
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)
    print("DAAAATA",data)
    if re.search('[a-fA-F]',data['test']['serial_number']):
        serial_number = int(data['test']['serial_number'].lower(),16)
        is_serial_number_hex = 1
    else:
        serial_number = data['test']['serial_number']
        is_serial_number_hex = 0
    checklists = Checklist.objects.filter(code=data['test']['checklist_code'])
    test_filtered = []
    for c in checklists:
        print c
        if len(test_filtered) < 1:
            test_filtered = Test.objects.filter(checklist=c, serial_number=serial_number, hex_serial_number=is_serial_number_hex)
            print c.version
        checklist = c
    test = Test()

    if len(test_filtered) > 0:
        test = test_filtered[0]
        is_update = 1

    if is_update == 0:
        test.status = "Novo"
        test.hex_serial_number = is_serial_number_hex
        test.serial_number = serial_number
        test.checklist = checklist
        steps = Step.objects.filter(checklist_id=test.checklist)
        print len(steps)
        print steps

        test.save()

        for step in steps:
            result = Result()
            result.step = step
            result.test = test
            result.user = '0'
            result.save()

    data_test = serializers.serialize("json", [test])
    print data_test

    return HttpResponse(data_test, 'checklist_site/test.html')

def test_good_practices_save(request):
    is_update = 0
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)
    good_practices_version = data['test']['good_practices_version']
    if re.search('[a-fA-F]',data['test']['serial_number']):
        serial_number = int(data['test']['serial_number'].lower(),16)
        is_serial_number_hex = 1
    else:
        serial_number = data['test']['serial_number']
        is_serial_number_hex = 0
    checklists = Checklist.objects.filter(code=data['test']['checklist_code'])
    test_filtered = []
    for c in checklists:
        print c
        if len(test_filtered) < 1:
            test_filtered = Test.objects.filter(checklist=c, serial_number=serial_number, hex_serial_number=is_serial_number_hex, good_practices_version=good_practices_version)
            print c.version
        checklist = c
    test = Test()

    if len(test_filtered) > 0:
        test = test_filtered[0]
        is_update = 1

    if is_update == 0:
        test.status = "Novo"
        test.good_practices_version = good_practices_version
        test.hex_serial_number = is_serial_number_hex
        test.serial_number = serial_number
        test.checklist = checklist
        steps = Step.objects.filter(checklist_id=test.checklist)
        print len(steps)
        print steps

        test.save()

        for step in steps:
            result = Result()
            result.step = step
            result.test = test
            result.user = '0'
            result.save()

    data_test = serializers.serialize("json", [test])
    print data_test

    return HttpResponse(data_test, 'checklist_site/test.html')

def test_close(request, test_id):
    test = get_object_or_404(Test, pk=test_id)
    test.status = 'Sucesso'
    test.save()
    return render(request, 'checklist_site/test.html')

def test_get(request, test_id):
    test = get_object_or_404(Test, pk=test_id)
    data = serializers.serialize("json", [test, test.checklist])
    return HttpResponse(data)

def tests_get_from_to(request, startIndex, endIndex, orderBy):
    tests = Test.objects.all().filter(~Q(status='checkout')).order_by(orderBy)[startIndex:endIndex]

    data = serializers.serialize("json", tests)
    return HttpResponse(data, "checklist_site/tests.html")

def tests_get_where(request, startIndex, endIndex, orderBy, field, value):
    if field == "serial_number":
        tests = Test.objects.all().filter(serial_number=value).order_by(orderBy)[startIndex:endIndex]

    elif field == "creation_date":
        tests = Test.objects.all().filter(creation_date=value).order_by(orderBy)[startIndex:endIndex]

    elif field == "finish_date":
        tests = Test.objects.all().filter(finish_date=value).order_by(orderBy)[startIndex:endIndex]

    elif field == "status":
        tests = Test.objects.all().filter(status=value).order_by(orderBy)[startIndex:endIndex]

    elif field == "checklist_id":
        tests = Test.objects.all().filter(checklist_id=value).order_by(orderBy)[startIndex:endIndex]

    elif field == "checkout_id":
        tests = Test.objects.all().filter(checkout_id=value).order_by(orderBy)[startIndex:endIndex]

    elif field == "committed":
        tests = Test.objects.all().filter(committed=value).order_by(orderBy)[startIndex:endIndex]

    elif field == "hex_serial_number":
        tests = Test.objects.all().filter(hex_serial_number=value).order_by(orderBy)[startIndex:endIndex]

    else:
        tests = Test.objects.all().order_by(orderBy)[startIndex:endIndex]

    data = serializers.serialize("json", tests)
    return HttpResponse(data, "checklist_site/tests.html")

def tests_count(request, field, value, negativeQuery):
    if field == "serial_number":
        count = Test.objects.all().filter(serial_number=value).count()

    elif field == "creation_date":
        count = Test.objects.all().filter(creation_date=value).count()

    elif field == "finish_date":
        count = Test.objects.all().filter(finish_date=value).count()

    elif field == "status":
        if negativeQuery == "1":
            count = Test.objects.all().filter(~Q(status=value)).count()
        else:
            count = Test.objects.all().filter(status=value).count()

    elif field == "checklist_id":
        count = Test.objects.all().filter(checklist_id=value).count()

    elif field == "checkout_id":
        count = Test.objects.all().filter(checkout_id=value).count()

    elif field == "committed":
        count = Test.objects.all().filter(committed=value).count()

    elif field == "hex_serial_number":
        count = Test.objects.all().filter(hex_serial_number=value).count()

    else:
        count = Test.objects.all().count()

    return HttpResponse(count, "checklist_site/tests.html")

def tests_get(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    for data_request in data['request']:
        data = data_request


    page = data['page']
    sort_sign = data['sortSign']
    sort_key = data['sortKey']
    filter_text = data['filterText']
    serial_filter_text = data['serialFilterText']
    code_filter_text = data['codeFilterText']
    status_filter = data['statusFilter']
    good_practices = data['goodPractice']

    items_per_page = 20

    if sort_sign == 'n':
        sort_sign = 'DESC'
    else:
        sort_sign = 'ASC'
    page_index = '0'

    if page == 1:
        page_index = '0'
    elif page == 2:
        page_index = str(items_per_page)
    else:
        page_index = str((page-1)*(items_per_page))
    table = "checklist_site_test."

    query = ("SELECT SQL_CALC_FOUND_ROWS checklist_site_test.id, "
    + "checklist_site_test.serial_number,"
    + "checklist_site_test.creation_date,"
    + "checklist_site_test.status,"
    + "checklist_site_test.checklist_id,"
    + "checklist_site_test.finish_date,"
    + "checklist_site_test.checkout_id,"
    + "checklist_site_test.committed,"
    + "checklist_site_test.hex_serial_number,"
    + "checklist_site_checklist.name,"
    + "checklist_site_checklist.code,"
    + "checklist_site_checklist.version "
    + "FROM checklist_site_test "
    + "INNER JOIN checklist_site_checklist "
    + "ON checklist_site_test.checklist_id=checklist_site_checklist.id "
    + "WHERE checklist_site_test.status <> 'Checkout' ")

    if good_practices:
        query = query + ("AND (checklist_site_checklist.good_practices = '1') ")
    if filter_text:
        query = query + ("AND (checklist_site_checklist.name LIKE '%" + filter_text + "%') ")

    if serial_filter_text:
        if (all(c in string.hexdigits for c in serial_filter_text) and not serial_filter_text.isdigit()):
            serial_filter_text = str(int(serial_filter_text,16))
        query = query + ("AND (checklist_site_test.serial_number = '" + serial_filter_text + "') ")

    if code_filter_text:
        query = query + ("AND (checklist_site_checklist.code = '" + code_filter_text + "') ")

    if status_filter:
        query = query + ("AND (checklist_site_test.status = '" + status_filter + "') ")

    if sort_key == "code":
        table = "checklist_site_checklist."
        query = query + "ORDER BY (checklist_site_checklist.code+0 != 'zzzzzz' IS NOT TRUE),CAST(checklist_site_checklist.code as unsigned) "
    else:
        query = query + "ORDER BY CAST(" + table + sort_key + " AS UNSIGNED) "
    query = query + (sort_sign
    +" LIMIT " + (page_index) + ",20"
    + ";")

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchall()

    cursor.execute("SELECT FOUND_ROWS();")
    num_rows = cursor.fetchall()
    num_rows = num_rows[0][0]
    results = []

    for r in row:

        result = {}
        result['checklist_version'] = r[11]
        result['checklist_code'] = r[10]
        result['checklist_name'] = r[9]
        result['test_hex_serial_number'] = r[8]
        result['test_committed'] = r[7]
        result['test_checkout_id'] = r[6]
        result['test_finish_date'] = str(r[5])
        result['test_checklist_id'] = r[4]
        result['test_status'] = r[3]
        result['test_creation_date'] = str(r[2])
        result['test_serial_number'] = r[1]
        result['test_id'] = r[0]

        results.append(result)

    data = {}
    data['tests'] = results
    data['num_pages'] = int(num_rows / (items_per_page*1.0))
    decimal_part = (num_rows / (items_per_page*1.0)) - data['num_pages']
    if decimal_part > 0 :
        data['num_pages'] = data['num_pages'] + 1

    for result in results:
        print(result)


    return HttpResponse(json.dumps(data), "checklist_site/tests.html")

def tests_good_practices_get(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    for data_request in data['request']:
        data = data_request


    page = data['page']
    sort_sign = data['sortSign']
    sort_key = data['sortKey']
    filter_text = data['filterText']
    serial_filter_text = data['serialFilterText']
    code_filter_text = data['codeFilterText']
    status_filter = data['statusFilter']
    good_practices = data['goodPractice']
    good_practices_version_filter_text = data['goodPracticesVersion']

    items_per_page = 20

    if sort_sign == 'n':
        sort_sign = 'DESC'
    else:
        sort_sign = 'ASC'
    page_index = '0'

    if page == 1:
        page_index = '0'
    elif page == 2:
        page_index = str(items_per_page)
    else:
        page_index = str((page-1)*(items_per_page))
    table = "checklist_site_test."

    query = ("SELECT SQL_CALC_FOUND_ROWS checklist_site_test.id, "
    + "checklist_site_test.serial_number,"
    + "checklist_site_test.creation_date,"
    + "checklist_site_test.status,"
    + "checklist_site_test.checklist_id,"
    + "checklist_site_test.finish_date,"
    + "checklist_site_test.checkout_id,"
    + "checklist_site_test.committed,"
    + "checklist_site_test.hex_serial_number,"
    + "checklist_site_checklist.name,"
    + "checklist_site_checklist.code,"
    + "checklist_site_checklist.version,"
    + "checklist_site_test.good_practices_version "
    + "FROM checklist_site_test "
    + "INNER JOIN checklist_site_checklist "
    + "ON checklist_site_test.checklist_id=checklist_site_checklist.id "
    + "WHERE checklist_site_test.status <> 'Checkout' ")

    if good_practices:
        query = query + ("AND (checklist_site_checklist.good_practices = '1') ")
    if filter_text:
        query = query + ("AND (checklist_site_checklist.name LIKE '%" + filter_text + "%') ")

    if serial_filter_text:
        if (all(c in string.hexdigits for c in serial_filter_text) and not serial_filter_text.isdigit()):
            serial_filter_text = str(int(serial_filter_text,16))
        query = query + ("AND (checklist_site_test.serial_number = '" + serial_filter_text + "') ")

    if code_filter_text:
        query = query + ("AND (checklist_site_checklist.code = '" + code_filter_text + "') ")

    if status_filter:
        query = query + ("AND (checklist_site_test.status = '" + status_filter + "') ")

    if good_practices_version_filter_text:
        query = query + ("AND (checklist_site_test.good_practices_version = '" + good_practices_version_filter_text + "') ")

    if sort_key == "code":
        table = "checklist_site_checklist."
        query = query + "ORDER BY (checklist_site_checklist.code+0 != 'zzzzzz' IS NOT TRUE),CAST(checklist_site_checklist.code as unsigned) "
    else:
        query = query + "ORDER BY CAST(" + table + sort_key + " AS UNSIGNED) "
    query = query + (sort_sign
    +" LIMIT " + (page_index) + ",20"
    + ";")

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchall()

    cursor.execute("SELECT FOUND_ROWS();")
    num_rows = cursor.fetchall()
    num_rows = num_rows[0][0]
    results = []

    for r in row:

        result = {}
        result['good_practices_version'] = r[12]
        result['checklist_version'] = r[11]
        result['checklist_code'] = r[10]
        result['checklist_name'] = r[9]
        result['test_hex_serial_number'] = r[8]
        result['test_committed'] = r[7]
        result['test_checkout_id'] = r[6]
        result['test_finish_date'] = str(r[5])
        result['test_checklist_id'] = r[4]
        result['test_status'] = r[3]
        result['test_creation_date'] = str(r[2])
        result['test_serial_number'] = r[1]
        result['test_id'] = r[0]

        results.append(result)

    data = {}
    data['tests'] = results
    data['num_pages'] = int(num_rows / (items_per_page*1.0))
    decimal_part = (num_rows / (items_per_page*1.0)) - data['num_pages']
    if decimal_part > 0 :
        data['num_pages'] = data['num_pages'] + 1



    return HttpResponse(json.dumps(data), "checklist_site/tests.html")


def test_waste(request, test_id):
    test = get_object_or_404(Test, pk=test_id)
    test.status = "Sucata"
    test.save()
    return render(request, "checklist_site/test.html")

def tests_get_for_checkout(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    for data_request in data['request']:
        data = data_request

    page = data['page']
    sort_sign = data['sortSign']
    sort_key = data['sortKey']
    filter_text = data['filterText']
    serial_filter_text = data['serialFilterText']
    code_filter_text = data['codeFilterText']

    items_per_page = 20

    if sort_sign == 'n':
        sort_sign = 'DESC'
    else:
        sort_sign = 'ASC'
    page_index = '0'

    if page == 1:
        page_index = '0'
    elif page == 2:
        page_index = str(items_per_page)
    else:
        page_index = str((page-1)*(items_per_page))

    table = 'checklist_site_test.'

    query =  ("SELECT SQL_CALC_FOUND_ROWS checklist_site_test.id, "
    +"checklist_site_test.serial_number, "
    +"checklist_site_test.creation_date, "
    +"checklist_site_test.status,"
    +"checklist_site_test.checklist_id,"
    +"checklist_site_test.finish_date,"
    +"checklist_site_test.checkout_id,"
    +"checklist_site_test.committed,"
    +"checklist_site_test.hex_serial_number,"
    +"checklist_site_checklist.name,"
    +"checklist_site_checklist.code,"
    +"checklist_site_checklist.version "
    +"FROM checklist_site_test "
    +"INNER JOIN checklist_site_checklist "
    +"ON checklist_site_test.checklist_id=checklist_site_checklist.id "
    +"WHERE checklist_site_test.status = 'Sucesso' "
    +"AND checklist_site_test.committed = '-1' "
    + "AND checklist_site_checklist.good_practices = 0 ")

    if filter_text:
        query = query + ("AND (checklist_site_checklist.name LIKE '%" + filter_text + "%') ")

    if serial_filter_text:
        if (all(c in string.hexdigits for c in serial_filter_text) and not serial_filter_text.isdigit()):
            serial_filter_text = str(int(serial_filter_text,16))
        query = query + ("AND (checklist_site_test.serial_number = '" + serial_filter_text + "') ")

    if code_filter_text:
        query = query + ("AND (checklist_site_checklist.code = '" + code_filter_text + "') ")
    if sort_key == "code":
        table = "checklist_site_checklist."
        query = query + "ORDER BY (checklist_site_checklist.code+0 != 'zzzzzz' IS NOT TRUE),CAST(checklist_site_checklist.code as unsigned) "
    else:
        query = query + "ORDER BY CAST(" + table + sort_key + " AS UNSIGNED) "
    query = query + (sort_sign
    +" LIMIT " + (page_index) + ",20"
    + ";")

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchall()

    cursor.execute("SELECT FOUND_ROWS();")
    num_rows = cursor.fetchall()
    num_rows = num_rows[0][0]
    print "NUM_ROWS: ", num_rows

    results = []

    for r in row:
        result = {}

        result['checklist_version'] = r[11]
        result['checklist_code'] = r[10]
        result['checklist_name'] = r[9]
        result['test_hex_serial_number'] = r[8]
        result['test_committed'] = r[7]
        result['test_checkout_id'] = r[6]
        result['test_finish_date'] = str(r[5])
        result['test_checklist_id'] = r[4]
        result['test_status'] = r[3]
        result['test_creation_date'] = str(r[2])
        result['test_serial_number'] = r[1]
        result['test_id'] = r[0]

        results.append(result)

    data = {}
    data['tests'] = results

    data['num_pages'] = int(num_rows / (items_per_page*1.0))
    decimal_part = (num_rows / (items_per_page*1.0)) - data['num_pages']
    if decimal_part > 0 :
        data['num_pages'] = data['num_pages'] + 1

    return HttpResponse(json.dumps(data), "checklist_site/tests.html")


def tests_get_by_checkout(request, checkout_id):
    print 'test get by checkout...',checkout_id

    query =  ("SELECT checklist_site_test.id, "    
    + "checklist_site_test.serial_number, "
    + "checklist_site_test.creation_date, "
    + "checklist_site_test.status,"
    + "checklist_site_test.checklist_id,"
    + "checklist_site_test.finish_date,"
    + "checklist_site_test.checkout_id,"
    + "checklist_site_test.committed,"
    + "checklist_site_test.hex_serial_number,"
    + "checklist_site_checklist.name,"
    + "checklist_site_checklist.code,"
    + "checklist_site_checklist.version "
    + "FROM checklist_site_test "
    + "INNER JOIN checklist_site_checklist "
    + "ON checklist_site_test.checklist_id=checklist_site_checklist.id "
    + "WHERE checklist_site_test.checkout_id = '"
    + checkout_id + "';"
    + "AND checklist_site_test.committed = '-1' "
    + "AND checklist_site_checklist.good_practices = 0 ")

    query = query + ("ORDER BY checklist_site_test.serial_number ASC "
    + ";")

    print 'query: ', query

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchall()

    results = []

    for r in row:
        result = {}

        result['checklist_version'] = r[11]
        result['checklist_code'] = r[10]
        result['checklist_name'] = r[9]
        result['test_hex_serial_number'] = r[8]
        result['test_committed'] = r[7]
        result['test_checkout_id'] = r[6]
        result['test_finish_date'] = str(r[5])
        result['test_checklist_id'] = r[4]
        result['test_status'] = r[3]
        result['test_creation_date'] = str(r[2])
        result['test_serial_number'] = r[1]
        result['test_id'] = r[0]

        results.append(result)

    data = {}
    data['tests'] = results

    return HttpResponse(json.dumps(data), "checklist_site/tests.html")


def tests_get_checkout(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    for data_request in data['request']:
        data = data_request


    page = data['page']
    sort_sign = data['sortSign']
    sort_key = data['sortKey']
    filter_text = data['filterText']
    serial_filter_text = data['serialFilterText']
    code_filter_text = data['codeFilterText']
    nf_filter_text = data['nfFilterText']
    client_filter_text = data['clientFilterText']

    items_per_page = 20

    if sort_sign == 'n':
        sort_sign = 'DESC'
    else:
        sort_sign = 'ASC'

    if page == 1:
        page_index = '0'
    elif page == 2:
        page_index = str(items_per_page)
    else:
        page_index = str((page-1)*(items_per_page))
    table = 'checklist_site_test.'
    filter_text = filter_text.replace('_',' ')

    query =  ("SELECT SQL_CALC_FOUND_ROWS checklist_site_test.id, "
    + "checklist_site_test.serial_number, "
    + "checklist_site_test.creation_date, "
    + "checklist_site_test.status,"
    + "checklist_site_test.checklist_id,"
    + "checklist_site_test.finish_date,"
    + "checklist_site_test.checkout_id,"
    + "checklist_site_test.committed,"
    + "checklist_site_test.hex_serial_number,"
    + "checklist_site_checklist.name,"
    + "checklist_site_checklist.code,"
    + "checklist_site_checklist.version,"
    + "checklist_site_checkout.note,"
    + "checklist_site_checkout.client "
    + "FROM checklist_site_test "
    + "INNER JOIN checklist_site_checklist "
    + "ON checklist_site_test.checklist_id=checklist_site_checklist.id "
    + "INNER JOIN checklist_site_checkout "
    + "ON checklist_site_test.checkout_id=checklist_site_checkout.id "
    + "WHERE checklist_site_test.status = 'Checkout' "
    + "AND checklist_site_checklist.good_practices = 0 ")

    if filter_text:
        query = query + ("AND (checklist_site_checklist.name LIKE '%" + filter_text + "%') ")

    if serial_filter_text:
        if (all(c in string.hexdigits for c in serial_filter_text) and not serial_filter_text.isdigit()):
            serial_filter_text = str(int(serial_filter_text,16))
        query = query + ("AND (checklist_site_test.serial_number = '" + serial_filter_text + "') ")

    if code_filter_text:
        query = query + ("AND (checklist_site_checklist.code = '" + code_filter_text + "') ")

    if client_filter_text:
        query = query + ("AND (checklist_site_checkout.client = '" + client_filter_text + "') ")

    if nf_filter_text:
        query = query + ("AND (checklist_site_checkout.note = '" + nf_filter_text + "') ")


    if (sort_key == 'note'):
        table = 'checklist_site_checkout.'
        query = query + "ORDER BY (checklist_site_checkout.note+0 != 'zzzzzz' IS NOT TRUE),CAST(checklist_site_checkout.note as unsigned) "
    elif (sort_key == 'client'):
        table = 'checklist_site_checkout.'
        query = query + "ORDER BY " + table + sort_key + " "
    elif sort_key == "code":
        table = "checklist_site_checklist."
        query = query + "ORDER BY (checklist_site_checklist.code+0 != 'zzzzzz' IS NOT TRUE),CAST(checklist_site_checklist.GoodPratices as unsigned) "
    else:
        query = query + "ORDER BY " + table + sort_key + " "
    query = query + (sort_sign
    +" LIMIT " + (page_index) + ",20"
    + ";")

    print 'query: ', query

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchall()

    cursor.execute("SELECT FOUND_ROWS();")
    num_rows = cursor.fetchall()
    num_rows = num_rows[0][0]
    print "NUM_ROWS: ", num_rows

    results = []

    for r in row:
        result = {}
        result['checkout_client'] = r[13]
        result['checkout_note'] = r[12]
        result['checklist_version'] = r[11]
        result['checklist_code'] = r[10]
        result['checklist_name'] = r[9]
        result['test_hex_serial_number'] = r[8]
        result['test_committed'] = r[7]
        result['test_checkout_id'] = r[6]
        result['test_finish_date'] = str(r[5])
        result['test_checklist_id'] = r[4]
        result['test_status'] = r[3]
        result['test_creation_date'] = str(r[2])
        result['test_serial_number'] = r[1]
        result['test_id'] = r[0]

        results.append(result)

    data = {}
    data['tests'] = results
    data['num_pages'] = int(num_rows / (items_per_page*1.0))
    decimal_part = (num_rows / (items_per_page*1.0)) - data['num_pages']
    if decimal_part > 0 :
        data['num_pages'] = data['num_pages'] + 1

    return HttpResponse(json.dumps(data), "checklist_site/tests.html")

def tests_get_all_for_test(request):

    query =  ("SELECT checklist_site_test.id, "
    +"checklist_site_test.serial_number, "
    +"checklist_site_test.hex_serial_number, "
    +"checklist_site_checklist.code,"
    +"checklist_site_checklist.version "
    +"FROM checklist_site_test "
    +"INNER JOIN checklist_site_checklist "
    +"ON checklist_site_test.checklist_id=checklist_site_checklist.id "
    +"WHERE checklist_site_test.status = 'Sucesso' "
    +"AND checklist_site_test.committed = '-1' "
    +"ORDER BY (checklist_site_test.serial_number+0 != 'zzzzzz' IS NOT TRUE),CAST(checklist_site_test.serial_number as unsigned) DESC;")

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchall()

    results = []
    for r in row:
        result = {}

        result['checklist_version'] = r[4]
        result['checklist_code'] = r[3]
        result['test_hex_serial_number'] = r[2]
        result['test_serial_number'] = r[1]
        result['test_id'] = r[0]

        results.append(result)

    data = {}
    data['tests'] = results

    return HttpResponse(json.dumps(data), "checklist_site/tests.html")


def results_get(request, test_id):
    test = get_object_or_404(Test, pk=test_id)
    results = Result.objects.filter(test_id=test)

    data = serializers.serialize("json", results)

    jobject = json.loads(data)

    for j in jobject:
        if j['fields']['user_id'] != '':
            j['fields']['user_name'] = User.objects.values('user_name').get(pk=int(j['fields']['user_id']))
        else:
            j['fields']['user_name'] = ''

    return HttpResponse(json.dumps(jobject), 'checklist_site/test.html')

def result_delete(request, result_id):
    result = get_object_or_404(Result, pk=result_id)
    result_temp = Result()
    result.success = result_temp.success
    result.result = result_temp.result
    result.text_result = result_temp.text_result
    result.user_id = result_temp.user_id
    result.save()

    return render(request, 'checklist_site/test.html')


def result_update(request, user_id):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    result = get_object_or_404(Result, pk=data['result']['id'])

    if result.step.input_type == 'Checklist':
        if (re.search('[a-zA-Z]', data['result']['text_result'])): # check if string contains letters
            tests = Test.objects.all().filter(serial_number=str(int(data['result']['text_result'], 16)), hex_serial_number='1')
        else:
            tests = Test.objects.all().filter(serial_number=data['result']['text_result'], hex_serial_number='0')

        for i in range(0, len(tests)):
            if tests[i].checklist.code == result.step.observation:
                tests[i].committed = result.test.id
                tests[i].save()
                break

    result.success = data['result']['success']
    result.result = data['result']['result']
    result.text_result = data['result']['text_result']
    result.finish_dateTime = datetime.datetime.now()
    result.user_id = user_id
    result.save()

    results_from_id = Result.objects.filter(test__id=result.test_id)

    for result_from_id in results_from_id:
        if result_from_id.success == False:
            result.test.status = "Iniciado"
            break
    result.test.finish_date = datetime.datetime.now()
    result.test.save()

    result.save()

    return render(request,'checklist_site/test.html')

def redcard_get_reworker_cousts(request, initYear, initMonth, initDay, endYear, endMonth, endDay):
    init = initYear + '-' + initMonth + '-' + initDay
    end = endYear + '-' + endMonth + '-' + endDay

    query = ("SELECT checklist_site_redcard.time, "
    + "checklist_site_redcard.custs "
    + "FROM checklist_site_redcard "
    + "WHERE (checklist_site_redcard.data BETWEEN '" + init + "' AND '" + end + "') ;")

    print 'query: ', query

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchall()

    results = {}
    prod = 0
    eng = 0
    qua = 0

    for r in row:
        result = {}
        result['time'] = r[0]
        result['custs'] = r[1]
        if result['time'] != "":
            if result['custs'] == "Engenharia":
                eng = eng + int(result['time'])
            elif result['custs'] == "Qualidade":
                qua = qua + int(result['time'])
            else:
                prod = prod + int(result['time'])

    results['prod'] = prod
    results['eng'] = eng
    results['qua'] = qua

    return HttpResponse(json.dumps(results), "checklist_site/reports.html")

def redcard_save(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    print "redcard_save...."

    try:
        redcard = RedCard.objects.get(pk=data['redcard']['id'])
        print "update redcard"
    except RedCard.DoesNotExist:
        print "novo redcard"
        redcard = RedCard()

    redcard.step = Step.objects.get(pk=data['redcard']['step_id'])
    redcard.test = Test.objects.get(pk=data['redcard']['test_id'])
    redcard.data = datetime.datetime.now()
    redcard.description = data['redcard']['description']
    redcard.cause = data['redcard']['cause']
    redcard.time = data['redcard']['time']
    redcard.custs = data['redcard']['custs']
    redcard.status = data['redcard']['status']

    print "salvando redcard..."
    print redcard.step.pk
    print redcard.test

    redcard.save()

    return render(request,'checklist_site/test.html',{'data':data})

def redcard_get(request, step_id, test_id):
    red_card = [RedCard.objects.get().filter(step_id=step_id, test_id=test_id).latest('data')]
    data = serializers.serialize("json", red_card)
    return HttpResponse(data)

def redcard_get_all_by_test(request, test_id):
    test = get_object_or_404(Test, pk=test_id)
    redcards = RedCard.objects.all().filter(test_id=test)
    data = serializers.serialize("json", redcards)
    return HttpResponse(data)

def login_check(request, user_id):
    try:
        login = get_object_or_404(Login, user_id=user_id)

        login.last_activity = datetime.datetime.now()
        login.save()

        data = serializers.serialize("json", [login])
        print "try data: " + data
        return HttpResponse(data)

    except:
        user = get_object_or_404(User, pk=user_id)
        login = Login()
        login.user = user
        login.last_activity = datetime.datetime.now()
        login.logged = False
        login.save()

        data = serializers.serialize("json", [login])
        print "exception data: " + data

        return HttpResponse(data)

def logout(request, user_id):
    print "LOGOUT!"
    login = Login.objects.get(user_id=user_id)
    login.logged = False
    login.save()


    data = serializers.serialize("json", [login])
    return render(data,'checklist_site/login.html')


def logout_sem_id(request):
    print "LOGOUT!"
    # login = Login.objects.get(user_id=user_id)
    # login.logged = False
    # login.save()


    # data = serializers.serialize("json", [login])
    return render(data,'checklist_site/login.html')
def login(request, user_id):
    login = Login.objects.get(user_id=user_id)
    login.logged = True
    login.save()
    data = serializers.serialize("json", [login])
    return HttpResponse(data)

def checkout_get_checkouts(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)
    print("request page:")
    for data_request in data['request']:
        data = data_request

    page = data['page']
    sort_sign = data['sortSign']
    sort_key = data['sortKey']
    filter_text = data['filterText']

    items_per_page = 20

    table = 'checklist_site_checkout.'

    if sort_sign == 'n':
        sort_sign = 'DESC'
    else:
        sort_sign = 'ASC'

    if page == 1:
        page_index = '0'
    elif page == 2:
        page_index = str(items_per_page)
    else:
        page_index = str((page-1)*(items_per_page))

    query =  ("SELECT SQL_CALC_FOUND_ROWS * "
    + "FROM checklist_site_checkout ")

    if "null" not in filter_text and filter_text != '':
        query = query + ("WHERE (checklist_site_checkout.client LIKE '%" + filter_text + "%' "
        + "OR checklist_site_checkout.note LIKE '%" + filter_text + "%') ")

    query = query + ("ORDER BY " + table + sort_key + " " + sort_sign
    +" LIMIT " + (page_index) + ",20"
    + ";")

    print 'query: ', query

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchall()

    cursor.execute("SELECT FOUND_ROWS();")
    num_rows = cursor.fetchall()
    num_rows = num_rows[0][0]
    print "NUM_ROWS: ", num_rows

    results = []

    for r in row:
        result = {}
        result['amount_of_tests'] = get_amount_of_tests_in_checkout(r[0])
        result['note'] = r[4]
        result['user'] = r[3]
        result['creation_dateTime'] = str(r[2])
        result['client'] = r[1]
        result['id'] = r[0]

        results.append(result)

    data = {}
    data['checkouts'] = results
    data['num_pages'] = int(num_rows / (items_per_page*1.0))
    decimal_part = (num_rows / (items_per_page*1.0)) - data['num_pages']
    if decimal_part > 0 :
        data['num_pages'] = data['num_pages'] + 1


    return HttpResponse(json.dumps(data), "checklist_site/tests.html")

def get_amount_of_tests_in_checkout(checkout_id):
    checkout = get_object_or_404(Checkout, pk=checkout_id)
    tests = Test.objects.filter(checkout=checkout)
    return len(tests)

def checkouts_get(request):
    checkouts = Checkout.objects.all()

    data = serializers.serialize("json", checkouts)
    return HttpResponse(data, "checklist_site/checkout.html")


def checkout_save(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    client = data['client']
    user_id = data['user_id']
    note = data['note']

    checkout = Checkout()
    checkout.client = client
    checkout.note = note
    checkout.user = get_object_or_404(User, pk=user_id)
    checkout.creation_dateTime = datetime.datetime.now()
    checkout.save()
    query = ""
    for i in range(0, len(data['tests'])):
        query = query + "UPDATE checklist_site_test SET checkout_id = " + str(checkout.pk) + ", status = 'Checkout' where id = " + str(data['tests'][i]) + ";"
        query = query + "UPDATE checklist_site_test SET checkout_id = " + str(checkout.pk) + ", status = 'Checkout' where committed = " + str(data['tests'][i]) + ";"

    cursor = connection.cursor()
    cursor.execute(query)

    data2 = serializers.serialize("json", [checkout])
    return HttpResponse(data2, 'checklist_site/checkout.html')

def checkout_save2(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    client = data['client']
    user_id = data['user_id']
    note = data['note']

    checkout = Checkout()
    checkout.client = client
    checkout.note = note
    checkout.user = get_object_or_404(User, pk=user_id)
    checkout.creation_dateTime = datetime.datetime.now()
    checkout.save()

    for i in range(0, len(data['tests'])):
        process_checkout(checkout, data['tests'][i])


    data2 = serializers.serialize("json", [checkout])
    return HttpResponse(data2, 'checklist_site/checkout.html')

def checkout_delete(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    checkout = get_object_or_404(Checkout, pk=data['checkout_id'])
    tests = Test.objects.filter(checkout_id=checkout.id, status='Checkout')

    for i in range(0, len(tests)):
        print(tests[i].serial_number),'....', tests[i].id
        tests[i].status = 'Sucesso'
        tests[i].checkout_id = -1
        tests[i].save()

    checkout.delete()

    return render(request,'checklist_site/checkout.html')

def process_checkout(checkout, test_id):
    test = get_object_or_404(Test, pk=test_id)
    test.checkout = checkout
    test.status = 'Checkout'
    test.save()

    tests = Test.objects.filter(committed=test.id)

    if len(tests) <= 0:
        return

    for i in range(0, len(tests)):
        process_checkout(checkout, tests[i].id)

def tests_get_red_card(request):
    json_data = request.read().decode('utf-8')
    data = json.loads(json_data)

    for data_request in data['request']:
        data = data_request


    page = data['page']
    sort_sign = data['sortSign']
    sort_key = data['sortKey']
    filter_text = data['filterText']
    serial_filter_text = data['serialFilterText']
    code_filter_text = data['codeFilterText']
    information_text = data['informationText']


    items_per_page = 20

    if sort_sign == 'n':
        sort_sign = 'DESC'
    else:
        sort_sign = 'ASC'

    if page == 1:
        page_index = '0'
    elif page == 2:
        page_index = str(items_per_page)
    else:
        page_index = str((page-1)*(items_per_page))

    table = 'checklist_site_test.'

    query = ("SELECT SQL_CALC_FOUND_ROWS checklist_site_test.id, "
    + "checklist_site_test.serial_number,"
    + "checklist_site_redcard.data,"
    + "checklist_site_redcard.status," 
    + "checklist_site_test.checklist_id,"
    + "checklist_site_test.finish_date,"
    + "checklist_site_test.checkout_id,"
    + "checklist_site_set.checkout_goodpractices,"
    + "checklist_site_test.committed,"
    + "checklist_site_test.hex_serial_number,"
    + "checklist_site_checklist.name,"
    + "checklist_site_checklist.code,"
    + "checklist_site_checklist.version,"
    + "checklist_site_redcard.id,"
    + "checklist_site_redcard.status "
    + "FROM checklist_site_test "
    + "INNER JOIN checklist_site_checklist "
    + "ON checklist_site_test.checklist_id=checklist_site_checklist.id "
    + "INNER JOIN checklist_site_redcard "
    + "ON checklist_site_test.id=checklist_site_redcard.test_id "
    )

    if filter_text:
        query = query + ("AND (checklist_site_checklist.name LIKE '%" + filter_text + "%') ")

    if serial_filter_text:
        if (all(c in string.hexdigits for c in serial_filter_text) and not serial_filter_text.isdigit()):
            serial_filter_text = str(int(serial_filter_text,16))
        query = query + ("AND (checklist_site_test.serial_number = '" + serial_filter_text + "') ")

    if code_filter_text:
        query = query + ("AND checklist_site_checklist.code = '" + code_filter_text + "' ")

    if information_text:
        query = query + ("AND (checklist_site_redcard.description LIKE '%" + information_text + "%' "
        + "OR checklist_site_redcard.cause LIKE '%" + information_text + "%') ")

    if (sort_key == 'data'):
        table = 'checklist_site_redcard.'
        query = query + "ORDER BY " + table + sort_key + " "
    elif (sort_key == 'status'):
        table = 'checklist_site_redcard.'
        query = query + "ORDER BY " + table + sort_key + " "
    elif sort_key == "code":
        table = "checklist_site_checklist."
        query = query + "ORDER BY (checklist_site_checklist.code+0 != 'zzzzzz' IS NOT TRUE),CAST(checklist_site_checklist.code as unsigned) "

    else:
        query = query + "ORDER BY CAST(" + table + sort_key + " AS UNSIGNED) "
    query = query + (sort_sign
    +" LIMIT " + (page_index) + ",20"
    + ";")

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchall()

    cursor.execute("SELECT FOUND_ROWS();")
    num_rows = cursor.fetchall()
    num_rows = num_rows[0][0]

    results = []

    for r in row:

        result = {}
        result['checklist_redcard_id'] = r[12]
        result['checklist_version'] = r[11]
        result['checklist_code'] = r[10]
        result['checklist_name'] = r[9]
        result['test_hex_serial_number'] = r[8]
        result['test_committed'] = r[7]
        result['test_checkout_id'] = r[6]
        result['test_finish_date'] = str(r[5])
        result['test_checklist_id'] = r[4]
        result['test_status'] = r[3]
        result['test_creation_date'] = str(r[2])
        result['test_serial_number'] = r[1]
        result['test_id'] = r[0]

        results.append(result)

    data = {}
    data['tests'] = results
    data['num_pages'] = int(num_rows / (items_per_page*1.0))
    decimal_part = (num_rows / (items_per_page*1.0)) - data['num_pages']
    if decimal_part > 0 :
        data['num_pages'] = data['num_pages'] + 1


    return HttpResponse(json.dumps(data), "checklist_site/tests.html")

def get_red_card(request, red_card_id):

    query = ("SELECT SQL_CALC_FOUND_ROWS checklist_site_redcard.id, "
    + "checklist_site_redcard.data,"
    + "checklist_site_redcard.description,"
    + "checklist_site_redcard.cause,"
    + "checklist_site_redcard.time,"
    + "checklist_site_redcard.custs,"
    + "checklist_site_redcard.status,"
    + "checklist_site_step.step_order,"
    + "checklist_site_step.text,"
    + "checklist_site_checklist.name,"
    + "checklist_site_checklist.code,"
    + "checklist_site_test.serial_number "
    + "FROM checklist_site_redcard "
    + "INNER JOIN checklist_site_step "
    + "ON checklist_site_redcard.step_id=checklist_site_step.id "
    + "INNER JOIN checklist_site_test "
    + "ON checklist_site_redcard.test_id=checklist_site_test.id "
    + "INNER JOIN checklist_site_checklist "
    + "ON checklist_site_test.checklist_id=checklist_site_checklist.id "
    + "AND checklist_site_redcard.id = '" + red_card_id  + "'"
    )

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchall()

    cursor.execute("SELECT FOUND_ROWS();")
    num_rows = cursor.fetchall()
    num_rows = num_rows[0][0]
    results = []

    for r in row:

        result = {}
        result['test'] = r[11]
        result['code'] = r[10]
        result['checklist'] = r[9]
        result['text'] = r[8]
        result['step_order'] = r[7]
        result['status'] = r[6]
        result['custs'] = r[5]
        result['time'] = str(r[4])
        result['cause'] = r[3]
        result['description'] = r[2]
        result['data'] = str(r[1])
        result['id'] = r[0]

        results.append(result)

    data = {}
    data['tests'] = results


    return HttpResponse(json.dumps(data), "checklist_site/tests.html")
