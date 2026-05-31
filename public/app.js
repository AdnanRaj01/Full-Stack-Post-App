console.log("app.js connected");

let deleteForms = document.querySelectorAll(".delete-form");

deleteForms.forEach((form) => {
    form.addEventListener("submit", (event) => {

        let answer = confirm("Are you sure you want to delete this chat?");

        if(answer === false){
            event.preventDefault();
        }
    });
});