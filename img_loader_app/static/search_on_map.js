  function PhotoContainer (elem_path,error_path,fields_path,save_button_path) {
    this.element_path = elem_path;
    this.error_path = error_path;
    this.fields_path = fields_path;
    this.save_button_path = save_button_path;

    this.error_template = null;
    this.id_key = "id";
    this.container = null;

    this.create_templates =  function (elem_template_path, error_template_path){
        this.element_template = $(elem_template_path).detach();
        this.error_template = $(error_template_path).detach();
    };

    this.set_container =  function(elem){
        this.container = $(elem);
        return this.container;
    };

    this.fill_fields = function(data, elem){
        elem.find(this.fields_path).each(function(idx,val){
            var key = $(this).attr("rel");
            $(this).text(data[key]);
        });
    };

    this.create_element =  function(data){
        var new_elem = this.element_template.clone(true);

        new_elem.attr("id", new_elem.attr("id") + data[this.id_key]);
        this.fill_fields(data, new_elem);
        return new_elem;
    };

    this.create_error =  function(data){
        var new_elem = this.error_template.clone(true);

        this.fill_fields(data, new_elem);
        return new_elem;
    };

    this.add_element = function(data) {

        this.container.append(this.create_element(data));
    };

    this.add_error = function(data){
        this.container.append(this.create_error(data));
    };

    this.empty =  function() {
        this.container.empty();
    };

    this.filter_all_elements = function(){
        return this.container.find(this.element_path);
    };

    this.serialize_all_elements = function(elements) {
        objects = [];
        var t = this;
        elements.each(function(idx, value){
            objects.push(t.serialize_element($(this)));
        });
        return objects;
    };

    this.prepare_field = function(field) {
        return field.text();
    }

    this.serialize_element = function(elem_obj) {
        var field_vals = {};
        var objects = elem_obj.find(this.fields_path);
        for(var i=0; i < objects.length; i++){
            var key = $(objects[i]).attr("rel");
            field_vals[key] = $(objects[i]).text();
            // field_vals[key] = this.prepare_field($(objects[i]));
        }
        return field_vals;
    };

    this.get_save_button = function() {
        return this.container.find(this.save_button_path);
    };
};


 function FlickrPhotoGetter(api_server_addr, save_url, 
                             form_path, element_path, 
                             request_additional_context){
    this.api_server_addr = api_server_addr;
    this.save_url = save_url;
    this.photo_container  = null;
    this.form_path  = form_path;
    this.element_path = element_path;
    this.objects_loading = false;
    this.current_request = null;
    this.request_additional_context = request_additional_context;

    this.set_container_templates = function(container_templ, error_templ){
        this.photo_container.create_templates(container_templ, error_templ);
    };

    this.create_photo_container =  function(container, save_button_path,
                                     elem_path, error_path, fields_path,
                                     prepare_field){
        this.photo_container = new PhotoContainer(elem_path, error_path,
                                          fields_path,save_button_path);
        var cnt = this.photo_container.set_container(container);
        var save_button = this.photo_container.get_save_button();
    
        if (prepare_field !== undefined) {
            this.photo_container.prepare_field = prepare_field;
        }
        
        var t = this;
        save_button.on("click", function (event){
            event.preventDefault();

            t.save_element($(this).parent());
        });

    };

    this.get_form_as_REST =  function(form) {
        var resp = $(form).serialize();
        if (this.request_additional_context !== undefined){
            resp+= this.request_additional_context;
        }
        //TODO:additional context
        return resp;
    };

    this.get_form_as_JSON =  function(form) {
        list_elements = form.serializeArray();
        return JSON.stringify(list_elements);
    };

    this.is_request_successful = function(data){
        return data["stat"] == "ok";
    };

    this.get_data_from_server =  function() {
        var url = this.api_server_addr + this.get_form_as_REST(this.form_path);
        //показать загрузку
        this.objects_loading = true;
        var t = this;
        this.current_request = $.getJSON(url,{}, function(data) {
            //сообщить об успехе
            if(t.is_request_successful(data)){
                photos = data["photos"]["photo"]
                for(var key in photos){
                    t.photo_container.add_element(photos[key]);
                }
            } else {
                t.photo_container.add_error(data);
            }
            t.objects_loading = false;
            t.current_request = null;
        });
    };

    this.reload_elements = function(){
        if(this.current_request !== null) {
            this.current_request.abort();
        }
        this.set_page(1);

        this.photo_container.empty();
        this.get_data_from_server();
    };

    this.load_new_elements = function(){
        if(!this.objects_loading){
            this.get_data_from_server();

            this.set_page(this.get_page() + 1);
        }
    };

    this.set_page = function(page) {
        var page_obj = $("input[name=page]");
        page_obj.val(page);
    };

    this.get_page = function(){
        var page_obj = $("input[name=page]");
        return parseInt(page_obj.val());
    };

    this.prep_for_JSON_serialize =  function(obj) {
        var prepared_obj = obj;
        //если это словарь, то обернем его списком
        if(!(typeof(obj)=="object" && "length" in obj)){
            prepared_obj = [obj];
        }

        return  prepared_obj;
    };

    this.set_inprocess_to_element = function(element){
        element.addClass("in_process");
    };

    this.set_saved_to_element = function(element){
        element.removeClass("in_process").addClass("saved");
    };

    this.filter_already_in_save = function(element){
        return element.not(".saved,.inprocess");
    };

    this.save_element =  function(element) {

        element = this.filter_already_in_save(element);

        var elem_to_save = this.photo_container.serialize_element(element);
        elem_to_save = this.prep_for_JSON_serialize(elem_to_save);

        elem_to_save = JSON.stringify(elem_to_save);
        this.set_inprocess_to_element(element);
        var t = this;
        $.ajax(this.save_url, {
            type: 'post',
            data: elem_to_save,
            dataType: 'json',
            contentType: 'application/json',
            success: function(data){
                t.set_saved_to_element(element);
            }
        });
    };

    this.save_all_elements =  function() {

        var raw_elements = this.photo_container.filter_all_elements();

        raw_elements = this.filter_already_in_save(raw_elements);
        this.set_inprocess_to_element(raw_elements);

        var elements =  this.photo_container.serialize_all_elements(
                                                       raw_elements);
        elements = this.prep_for_JSON_serialize(elements);
        
        elements = JSON.stringify(elements);
        var t = this;
        $.ajax(this.save_url, {
            type: 'post',
            data: elements,
            dataType: 'json',
            contentType: 'application/json',
            success: function(data){
                t.set_saved_to_element(raw_elements);
            }
        });
    }
};


//добавим CSRF токен в запросы
function getCookie(name) {
    var cookieValue = null;
    if(document.cookies && document.cookies !== '') {
        var cookies = document.cookies.split(";");
        for(var i = 0; i < cookies.length; i++){
            var cookie = jQuery.trim(cookies[i]);

            if(cookie.substring(0, name.length + (name + "="))){
                cookieValue = decodeURIComponent(cookie.substring(name.length+1));
                break;
            }
        }
    }
    return cookieValue;
}

var csrf_token = getCookie("csrftoken");

function csrfSafeMethod(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend : function (xhr, settings){
        if(!csrfSafeMethod(settings.type) && this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

