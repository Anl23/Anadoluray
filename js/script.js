function openLine(element){

    let content = element.nextElementSibling;

    content.classList.toggle("active");

}

const contactForm = document.querySelector(".contact-form");

if(contactForm){

    const requiredFields = contactForm.querySelectorAll("[required]");

    requiredFields.forEach(field => {

        field.addEventListener("invalid", ()=>{
            field.parentElement.classList.add("has-error");
        });

        field.addEventListener("input", ()=>{
            if(field.value.trim()){
                field.parentElement.classList.remove("has-error");
            }
        });

    });

    contactForm.addEventListener("submit", async event => {

        event.preventDefault();

        let hasEmptyField = false;
        const success = document.querySelector("#form-success");
        const error = document.querySelector("#form-error");
        const button = document.querySelector("#submit-btn");

        requiredFields.forEach(field => {
            const isEmpty = !field.value.trim();
            field.parentElement.classList.toggle("has-error", isEmpty);
            hasEmptyField = hasEmptyField || isEmpty;
        });

        if(hasEmptyField){
            return;
        }

        button.disabled = true;
        button.textContent = "Gönderiliyor...";
        success.textContent = "";
        error.textContent = "";

        try{

            const response = await fetch(contactForm.action, {
                method: "POST",
                body: new FormData(contactForm),
                headers: {
                    Accept: "application/json"
                }
            });

            if(response.ok){
                contactForm.reset();
                success.textContent = "Mesajınız başarıyla gönderildi!";
            }else{
                error.textContent = "Mesaj gönderilirken bir hata oluştu.";
            }

        }catch(errorResponse){
            error.textContent = "Bağlantı hatası oluştu. Lütfen tekrar deneyin.";
        }finally{
            button.disabled = false;
            button.textContent = "Mesajı Gönder";
        }

    });

}


// Hamburger menü

const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");
const sidebarCollapse = document.querySelector(".sidebar-collapse");


if(menuToggle && sidebar){

    menuToggle.addEventListener("click", ()=>{

        if(window.innerWidth <= 768){
            sidebar.classList.toggle("active");
        }else{
            document.body.classList.remove("desktop-sidebar-collapsed");
        }

    });

}

if(sidebarCollapse){

    sidebarCollapse.addEventListener("click", ()=>{

        document.body.classList.add("desktop-sidebar-collapsed");

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

if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains("active")) {
if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
sidebar.classList.remove("active");
}
}
});
