// 1. firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCodecXd1fbqeJBMvsNKc2MDLW3a6Q4KdY",
    authDomain: "devsync-1ad15.firebaseapp.com",
    projectId: "devsync-1ad15",
    storageBucket: "devsync-1ad15.firebasestorage.app",
    messagingSenderId: "842071679787",
    appId: "1:842071679787:web:57d448fb70a23571621b6e",
    measurementId: "G-DLGFXDR1G2"
};
// 2. initialize firebase
firebase.initializeApp(firebaseConfig);
// Firebase Authentication
const auth = firebase.auth();
// Firebase Firestore
const db = firebase.firestore();

// 3. get html elements
// header buttons
const signupBtn = document.getElementById("sign-up");
const loginBtn = document.getElementById("log-in");
// models
const signModal = document.getElementById("sign-interface");
const loginModal = document.getElementById("login-modal");
// inputs 
const signUsername = document.getElementById("sign-username");
const signEmail = document.getElementById("sign-email");
const signPass = document.getElementById("password-input");
const loginEmail = document.getElementById("login-email");
const loginPass = document.getElementById("login-pass");
// buttons
const emailSubmit = document.querySelector(".email-submit");
const loginSubmit = document.querySelector(".login-submit");
// Error Messages
const signupErrorMsg = document.getElementById("signup-error-msg");
const errorMsg = document.getElementById("error-msg");
// 4. open sign up model
signupBtn.addEventListener("click", () => {
    signModal.classList.remove("hidden");
    signupErrorMsg.style.display = "none";
    signupErrorMsg.innerText = "";
});
// 5. open login model
loginBtn.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
    errorMsg.style.display = "none";
    errorMsg.innerText = "";
});
// 6. sign up
emailSubmit.addEventListener("click", async (e) => {
    e.preventDefault();
    // get user input
    const username = signUsername.value.trim();
    const email = signEmail.value.trim();
    const password = signPass.value.trim();
    // check empty fields
    if (!username || !email || !password) {
        showSignupError("Please enter your username, email and password.");
        return;
    }
    // check password length
    if (password.length < 6) {
        showSignupError( "Password must be at least 6 characters.");
        return;
    }
    try {
        // create firebase account
        const userCredential = await auth.createUserWithEmailAndPassword(email,password);
        // get firebase user
        const user = userCredential.user;
        console.log("Firebase Authentication account created.");
        console.log("User ID:", user.uid);
        // create user profile
        await db.collection("users").doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                username: username,
                country: "",
                phone: "",
                profilePicture: "",
                createdAt:firebase.firestore.FieldValue.serverTimestamp()
            });
        console.log("User profile successfully created.");
        // create default personal board
        await db.collection("boards").add({
                name: username,
                ownerId: user.uid,
                ownerEmail: user.email,
                isDefaultBoard: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        console.log("Default personal board created successfully.");
        // success
        alert("Account created successfully!");
        // go to dashboard
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("SIGN UP ERROR:",error);
        // handle error
        if (error.code === "auth/email-already-in-use") {
            showSignupError("This email is already registered.");
        } else if (error.code === "auth/invalid-email") {
            showSignupError("Please enter a valid email.");
        } else if ( error.code === "auth/weak-password") {
            showSignupError("Password is too weak. Use at least 6 characters.");
        } else {
            showSignupError("Something went wrong. Please try again.");
            console.error(error.code, error.message);
        }
    }
});
// 7.show sign up error
function showSignupError(message) {
    signupErrorMsg.innerText = message;
    signupErrorMsg.style.display = "block";
    // Shake Modal
    signModal.querySelector(".modal-content").classList.add("shake");
    setTimeout(() => {
        signModal.querySelector(".modal-content").classList.remove("shake");
    }, 300);
}
// 8. login
loginSubmit.addEventListener("click", async (e) => {
    e.preventDefault();
    // get input values
    const email = loginEmail.value.trim();
    const password = loginPass.value.trim();
    // check empty fields
    if (!email || !password) {
        showLoginError( "Please enter your email and password." );
        return;
    }
    try {
        // firebase login
        const userCredential =
            await auth.signInWithEmailAndPassword(email,password);
        const user = userCredential.user;
        console.log( "Login successful!" );
        console.log( "Logged in User ID:", user.uid );
        // go to dashboard
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error( "LOGIN ERROR:", error );
        // handle login errors
        if ( error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
            showLoginError( "Email or password is incorrect.");
        } else if ( error.code === "auth/invalid-email") {
            showLoginError( "Please enter a valid email.");
        } else {
            showLoginError( "Login failed. Please try again." );
        }
    }
});

// 9. show login error
function showLoginError(message) {
    errorMsg.innerText = message;
    errorMsg.style.display = "block";
    // Shake Modal
    loginModal.querySelector(".modal-content").classList.add("shake");
    setTimeout(() => {
        loginModal.querySelector(".modal-content").classList.remove("shake");
    }, 300);
}
// 10. close models
window.addEventListener("click", (e) => {
    // Close Sign Up
    if (e.target === signModal) {
        signModal.classList.add("hidden");
        signupErrorMsg.style.display = "none";
        signupErrorMsg.innerText = "";
    }
    // Close Login
    if (e.target === loginModal) {
        loginModal.classList.add("hidden");
        errorMsg.style.display = "none";
        errorMsg.innerText = "";
    }
});

// install
let deferredPrompt;
const installBtn = document.getElementById('install-btn');
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("App ready to install");
});
if(installBtn){
    installBtn.addEventListener('click', async ()=>{
        if(!deferredPrompt){
            alert("Install is not available yet");
            return;
        }
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        console.log(result.outcome);
        deferredPrompt = null;
    });

}