function openLine(element){

    let content = element.nextElementSibling;

    content.classList.toggle("active");

}


// Hamburger menü

const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");


if(menuToggle && sidebar){

    menuToggle.addEventListener("click", ()=>{

        sidebar.classList.toggle("active");

    });

}
const themeButtons = document.querySelectorAll(".theme-toggle");


themeButtons.forEach(button => {

    button.addEventListener("click", ()=>{


        document.body.classList.toggle("dark");


        if(document.body.classList.contains("dark")){

            localStorage.setItem("theme","dark");

        }else{

            localStorage.setItem("theme","light");

        }


    });

});



if(localStorage.getItem("theme") === "dark"){

    document.body.classList.add("dark");

}
document.addEventListener("click", function(event) {
const sidebar = document.querySelector(".sidebar");
const menuToggle = document.querySelector(".menu-toggle");

if (sidebar && sidebar.classList.contains("active")) {
if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
sidebar.classList.remove("active");
}
}
});
