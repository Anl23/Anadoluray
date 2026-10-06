function openLine(element){

    const content = element.nextElementSibling;

    if(!content){
        return;
    }

    const isOpen = content.classList.contains("active");
    content.classList.toggle("active", !isOpen);
    element.classList.toggle("active", !isOpen);
    element.setAttribute("aria-expanded", String(!isOpen));

    if(content.classList.contains("active")){
        const contentHeight = content.scrollHeight + 40;
        content.style.maxHeight = `${contentHeight}px`;
        content.style.opacity = "1";
    }else{
        content.style.maxHeight = "0px";
        content.style.opacity = "0";
    }

}

function getRemainingText(targetDate){

    const now = new Date();
    const target = new Date(targetDate);
    const difference = target - now;

    if(difference <= 0){
        return "Açıldı";
    }

    let years = target.getFullYear() - now.getFullYear();
    let months = target.getMonth() - now.getMonth();
    let days = target.getDate() - now.getDate();

    if(days < 0){
        const previousMonth = new Date(target.getFullYear(), target.getMonth(), 0);
        const daysInPreviousMonth = previousMonth.getDate();
        days += daysInPreviousMonth;
        months -= 1;
    }

    if(months < 0){
        years -= 1;
        months += 12;
    }

    const parts = [];

    if(years > 0){
        parts.push(`${years} ${years === 1 ? "yıl" : "yıl"}`);
    }

    if(months > 0){
        parts.push(`${months} ${months === 1 ? "ay" : "ay"}`);
    }

    if(days > 0){
        parts.push(`${days} ${days === 1 ? "gün" : "gün"}`);
    }

    if(parts.length === 0){
        return "Bugün";
    }

    return parts.join(" ");

}

function updateCountdowns(){

    const items = document.querySelectorAll(".completion-item[data-target]");

    items.forEach(item => {
        const dateNode = item.querySelector(".completion-date");

        if(!dateNode){
            return;
        }

        const targetDate = item.dataset.target;
        dateNode.textContent = `Kalan süre: ${getRemainingText(targetDate)}`;
    });

}

updateCountdowns();
setInterval(updateCountdowns, 60000);

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

    const syncSidebarState = () => {
        document.body.classList.toggle("sidebar-open", sidebar.classList.contains("active"));
    };

    menuToggle.addEventListener("click", ()=>{

        if(window.innerWidth <= 768){
            const shouldOpen = !sidebar.classList.contains("active");
            sidebar.classList.toggle("active", shouldOpen);
            syncSidebarState();
        }else{
            document.body.classList.remove("desktop-sidebar-collapsed");
        }

    });

    syncSidebarState();

}

if(sidebarCollapse){

    sidebarCollapse.addEventListener("click", ()=>{

        document.body.classList.add("desktop-sidebar-collapsed");

    });

}
const themeMenu = document.querySelector(".theme-menu");
const themeMenuTrigger = document.querySelector(".theme-menu-trigger");
const themeMenuOptions = document.querySelector(".theme-menu-options");

if(themeMenu && themeMenuTrigger && themeMenuOptions){
    themeMenuTrigger.addEventListener("click", ()=>{
        const isExpanded = themeMenuTrigger.getAttribute("aria-expanded") === "true";
        themeMenuTrigger.setAttribute("aria-expanded", String(!isExpanded));
        themeMenuOptions.hidden = isExpanded;
    });

    themeMenuOptions.querySelectorAll(".theme-option").forEach(button => {
        button.addEventListener("click", ()=>{
            const isDark = button.dataset.theme === "dark";
            document.body.classList.toggle("dark", isDark);
            document.documentElement.classList.toggle("dark", isDark);
            localStorage.setItem("theme", isDark ? "dark" : "light");
            themeMenuOptions.hidden = true;
            themeMenuTrigger.setAttribute("aria-expanded", "false");
        });
    });

    document.addEventListener("click", event => {
        if(!themeMenu.contains(event.target)){
            themeMenuOptions.hidden = true;
            themeMenuTrigger.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", event => {
        if(event.key === "Escape"){
            themeMenuOptions.hidden = true;
            themeMenuTrigger.setAttribute("aria-expanded", "false");
        }
    });
}



const savedTheme = localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
document.body.classList.toggle("dark", savedTheme);
document.documentElement.classList.toggle("dark", savedTheme);
document.addEventListener("click", function(event) {
const sidebar = document.querySelector(".sidebar");
const menuToggle = document.querySelector(".menu-toggle");

if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains("active")) {
if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
sidebar.classList.remove("active");
document.body.classList.remove("sidebar-open");
}
}
});
