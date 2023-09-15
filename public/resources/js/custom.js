$('.dropdown-menu').click(function(e) {
    e.stopPropagation();
});
$(".information_contact_box").click(function(){
  $(".step_2_area").toggleClass("information_contact_open");
});
$(".information_form_box").click(function(){
  $(".step_2_area").toggleClass("information_form_open");
});

