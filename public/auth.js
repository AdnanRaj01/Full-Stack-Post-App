const togglePassword =
document.querySelectorAll('.togglePassword');

togglePassword.forEach(icon => {

    icon.addEventListener('click', () => {

        const passwordInput =
        icon.previousElementSibling;

        if(passwordInput.type === 'password'){

            passwordInput.type = 'text';

            icon.classList.remove('fa-eye');

            icon.classList.add('fa-eye-slash');

        }else{

            passwordInput.type = 'password';

            icon.classList.remove('fa-eye-slash');

            icon.classList.add('fa-eye');
        }
    });
});

const closeButtons =
document.querySelectorAll('.closeAlert');

closeButtons.forEach(btn => {

    btn.addEventListener('click', () => {

        btn.parentElement.style.display =
        'none';
    });
});