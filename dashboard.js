// FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyCodecXd1fbqeJBMvsNKc2MDLW3a6Q4KdY",
    authDomain: "devsync-1ad15.firebaseapp.com",
    projectId: "devsync-1ad15",
    storageBucket: "devsync-1ad15.firebasestorage.app",
    messagingSenderId: "842071679787",
    appId: "1:842071679787:web:57d448fb70a23571621b6e",
    measurementId: "G-DLGFXDR1G2"
};

// INITIALIZE FIREBASE
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;
let currentUserData = null;

// AUTH STATE
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        console.log("No user logged in.");
        window.location.href = "index.html";
        return;
    }
    currentUser = user;
    try {
        // LOAD USER PROFILE
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
            console.log("User profile not found.");
            return;
        }
        currentUserData = userDoc.data();
        const username = currentUserData.username || user.email || "User";
        const profilePicture = currentUserData.profilePicture || "";
        // UPDATE SIDEBAR USERNAME
        const navUsername = document.getElementById("nav-username");
        if (navUsername) {
             navUsername.innerText = username;
        }
        // UPDATE SIDEBAR AVATAR
        const navAvatar = document.getElementById("nav-avatar");
        if (navAvatar) {
            if (profilePicture) {
                navAvatar.innerHTML = ` <img src="${profilePicture}" alt="Profile Picture"> `;
            } else {
                navAvatar.innerHTML = ` <span id="nav-avatar-text">
                        ${getInitials(username)}
                    </span> `;
            }
        }
        // UPDATE SETTINGS
        const usernameInput = document.getElementById("set-username");
        const countryInput = document.getElementById("set-country");
        const phoneInput = document.getElementById("set-phone");
        if (usernameInput) {
            usernameInput.value = currentUserData.username || "";
        }
        if (countryInput) {
            countryInput.value = currentUserData.country || "";
        }
        if (phoneInput) {
            phoneInput.value = currentUserData.phone || "";
        }

        // PROFILE IMAGE IN SETTINGS
        const picPreview = document.getElementById("pic-preview");
        if (picPreview) {
            if (profilePicture) {
                picPreview.innerHTML = `
                    <img src="${profilePicture}" alt="Profile Picture">
                `;
            } else {
                picPreview.innerHTML = ` <i class="fas fa-user"></i> `;
            }
        }
        // LOAD DATA
        await loadUserRole();
        await loadUserBoards();
        await loadUserTeams();
        await loadFriends();
        await loadDashboardAnalytics();
    } catch (error) {
        console.error( "Error loading dashboard:", error);
    }
});
// GET INITIALS
function getInitials(name) {
    if (!name) {
        return "DS";
    }
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return ( words[0].charAt(0) + words[1].charAt(0) ).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// SIDEBAR NAVIGATION
const menuItems = document.querySelectorAll( ".sidebar-menu li, .sidebar-footer li[data-section]" );
const contentSections = document.querySelectorAll( ".content-section" );
menuItems.forEach((item) => {
    item.addEventListener( "click", async () => {
            const sectionId = item.getAttribute("data-section");
            if (!sectionId) {
                return;
            }
            menuItems.forEach((menuItem) => {
                    menuItem.classList.remove(
                        "active"
                    );
                } 
            );
            item.classList.add( "active" );
            contentSections.forEach( (section) => {
                    section.classList.add( "hidden" );
                });

            const selectedSection = document.getElementById( sectionId );
            if (selectedSection) {
                selectedSection.classList.remove( "hidden" );
            }
            if ( sectionId === "dashboard-section" ) {
                await loadDashboardAnalytics();
            }
            if ( sectionId === "teams-section" ) {
                await loadUserTeams();
            }
        }
    );
});

// PROFILE SETTINGS
const profileForm = document.getElementById( "profile-form" );
if (profileForm) {
    profileForm.addEventListener( "submit", async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) {
                alert( "You must be logged in." );
                return;
            }
            const username = document.getElementById( "set-username" ).value.trim();
            const country = document.getElementById( "set-country" ).value.trim();
            const phone = document.getElementById( "set-phone" ).value.trim();
            try {
                await db.collection("users").doc(user.uid).update({
                        username,
                        country,
                        phone
                    });
                currentUserData.username = username;
                currentUserData.country = country;
                currentUserData.phone = phone;
                const navUsername = document.getElementById( "nav-username" );
                if (navUsername) { 
                    navUsername.innerText = username ||
                    user.email;
                }
                alert( "Profile updated successfully!" );
            } catch (error) {
                console.error( "Profile update error:", error );
                alert( "Failed to update profile." );
            }
        }
    );
}
// PROFILE PICTURE
const uploadInput = document.getElementById( "upload-input" );
if (uploadInput) {
    uploadInput.addEventListener( "change", async (e) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }
            if ( !file.type.startsWith("image/") ) {
                alert( "Please select an image file." );
                return;
            }
            const user = auth.currentUser;
            if (!user) {
                alert( "You must be logged in." );
                return;
            }
            const reader = new FileReader();
            reader.onload = async function () {
                    const imageBase64 = reader.result;
                    try {
                        await db.collection("users").doc(user.uid).update({
                                profilePicture:
                                    imageBase64
                            });
                        currentUserData.profilePicture = imageBase64;
                        const picPreview = document.getElementById( "pic-preview" );
                        if (picPreview) {
                            picPreview.innerHTML = ` 
                            <img
                                src="${imageBase64}"
                                alt="Profile Picture"
                            >
                            `;
                        }
                        const navAvatar = document.getElementById( "nav-avatar" );
                        if (navAvatar) {
                            navAvatar.innerHTML = `
                                <img
                                    src="${imageBase64}"
                                    alt="Profile Picture"
                                >
                            `;
                        }
                        alert( "Profile picture saved successfully!" );
                    } catch (error) {
                        console.error( "Image upload error:",error );
                        alert( "Failed to save profile picture." );
                    }
                };
            reader.readAsDataURL(file);
        }
    );
}

// LOGOUT
const logoutBtn = document.getElementById( "logout-btn" );
if (logoutBtn) {
    logoutBtn.addEventListener( "click", async () => {
            try {
                await auth.signOut();
                window.location.replace( "./Landing Page.html" );
            } catch (error) {
                console.error( "Logout error:", error );
                alert( "Logout failed. Please try again." );
            }
        }
    );
}
// PROJECTS / BOARDS

// NEW BOARD MODAL
const newBoardBtn = document.getElementById( "new-board-btn" );
const newBoardModal = document.getElementById( "new-board-modal" );
const cancelBoardBtn = document.getElementById( "cancel-board-btn" );
const createBoardBtn = document.getElementById( "create-board-btn" );
const boardNameInput = document.getElementById( "board-name-input" );

// OPEN BOARD MODAL
if (newBoardBtn) {
    newBoardBtn.addEventListener( "click", () => {
            if (!newBoardModal) {
                return;
            } 
            newBoardModal.classList.remove( "hidden" );

            if (boardNameInput) {
                boardNameInput.value = "";
                boardNameInput.focus();
            }
        }
    );
}
// CLOSE BOARD MODAL
if (cancelBoardBtn) {
    cancelBoardBtn.addEventListener( "click", () => {
            if (newBoardModal) {
                newBoardModal.classList.add(
                    "hidden"
                );
            }
            if (boardNameInput) {
                boardNameInput.value = "";
            }
        }
    );
}
// CREATE NEW BOARD

if (createBoardBtn) {
    createBoardBtn.addEventListener( "click", async () => {
            const boardName = boardNameInput.value.trim();
            const user = auth.currentUser;
            if (!boardName) {
                alert( "Please enter a board name." );
                boardNameInput.focus();
                return;
            }
            if (!user) {
                alert( "You must be logged in." );
                return;
            }
            try {
                await db.collection("boards").add({
                        name: boardName,
                        ownerId: user.uid,
                        ownerEmail: user.email,
                        createdBy: user.uid,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                newBoardModal.classList.add( "hidden" );
                boardNameInput.value = "";
                await loadUserBoards();
                await loadDashboardAnalytics();
            } catch (error) {
                console.error( "Create board error:", error );
                alert( "Failed to create board." );
            }
        }
    );
}

// LOAD USER BOARDS
async function loadUserBoards() {
    const user = auth.currentUser;
    if (!user) {
        return;
    }
    const projectsGrid = document.getElementById( "projects-grid" );
    if (!projectsGrid) {
        return;
    }
    try {
        const boardsSnapshot = await db.collection("boards").where("ownerId","==",user.uid).get();
        projectsGrid.innerHTML = "";
        if (boardsSnapshot.empty) {
            projectsGrid.innerHTML = `
                <div class="project-user-card">
                    <div class="user-header">
                        <div class="empty-avatar">
                            <i class="fas fa-folder"></i>
                        </div>
                        <div class="user-info">
                            <h4>
                                No Boards Yet
                            </h4>
                            <small>
                                Create your first board
                            </small>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        boardsSnapshot.forEach( (doc) => {
                const board = doc.data();
                createBoardCard( doc.id,board,projectsGrid );
            }
        );
    } catch (error) {
        console.error( "Load boards error:", error );
    }
}

// CREATE BOARD CARD
function createBoardCard( boardId, board, projectsGrid) {
    const boardCard = document.createElement("div");
    boardCard.className = "project-user-card dynamic-board-card";
    boardCard.dataset.boardId = boardId;
    boardCard.innerHTML = `
        <div class="user-header">
            <div class="empty-avatar">
                ${getInitials(board.name)}
            </div>
            <div class="user-info">
                <h4>
                    ${escapeHTML(board.name)}
                </h4>
                <small class="task-count">
                    0 Tasks
                </small>
            </div>
        </div>
        <ul class="task-list"></ul>
        <button
            class="add-task-inline-btn"
            data-board-id="${boardId}"
        >
            <i class="fas fa-plus"></i>
            Add New Task
        </button>
    `;

    projectsGrid.appendChild(boardCard);
    loadBoardTasks(boardId, boardCard);
    const addTaskBtn = boardCard.querySelector(".add-task-inline-btn");
    if (addTaskBtn) {
        addTaskBtn.addEventListener( "click", () => {
                addNewTask(
                    boardId,
                    boardCard
                );
            }
        );
    }
}

// LOAD BOARD TASKS
async function loadBoardTasks( boardId, boardCard ) {
    const taskList = boardCard.querySelector( ".task-list" );
    const taskCount = boardCard.querySelector( ".task-count" );
    try {
        const tasksSnapshot = await db.collection("boards").doc(boardId)
                .collection("tasks").orderBy("createdAt","asc").get();
        taskList.innerHTML = "";
        if (tasksSnapshot.empty) {
            taskList.innerHTML = `
                <li class="task-item pending">
                    <span>
                        No tasks yet
                    </span>
                    <span class="badge">
                        Empty
                    </span>
                </li>
            `;
        }
        tasksSnapshot.forEach( (taskDoc) => {
                const task = taskDoc.data();
                createTaskElement(
                    boardId,
                    taskDoc.id,
                    task,
                    taskList
                );
            }
        );
        const count = tasksSnapshot.size;
        taskCount.innerText = `${count} Task${count !== 1 ? "s" : ""}`;
    } catch (error) {
        console.error( "Load tasks error:", error );
    }
}

// ADD NEW TASK
async function addNewTask( boardId, boardCard) {
    const taskName = prompt( "Enter task name:" );
    if (!taskName) {
        return;
    }
    const cleanTaskName = taskName.trim();
    if (!cleanTaskName) {
        return;
    }
    try {
        await db.collection("boards").doc(boardId).collection("tasks").add({
                name: cleanTaskName,
                status: "pending",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        await loadBoardTasks( boardId, boardCard );
        await loadDashboardAnalytics();
    } catch (error) {
        console.error( "Add task error:",error );
        alert( "Failed to add task." );
    }
}

// CREATE TASK ELEMENT
function createTaskElement(boardId,taskId,task,taskList) {
    const li = document.createElement("li");
    const status = task.status === "done"? "done" : "pending";
    li.className = `task-item ${status}`;
    li.innerHTML = `
        <span>
            ${escapeHTML(task.name)}
        </span>
        <div class="task-item-controls">
            <select
                class="task-status-select"
            >
                <option
                    value="pending"
                    ${status === "pending"? "selected": ""}
                >
                    Pending
                </option>
                <option
                    value="done"
                    ${status === "done"? "selected": ""}
                >
                    Done
                </option>
            </select>
            <button
                class="delete-task-btn"
                title="Delete Task"
            >
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    const statusSelect = li.querySelector(".task-status-select");
    const deleteBtn = li.querySelector(".delete-task-btn");
    statusSelect.addEventListener("change",async () => {
            const newStatus = statusSelect.value;
            try {
                await db.collection("boards").doc(boardId)
                    .collection("tasks").doc(taskId).update({
                        status: newStatus
                    });
                li.classList.remove("pending","done" );
                li.classList.add(newStatus);
                await loadDashboardAnalytics();
            } catch (error) {
                console.error("Update task status error:",error);
                alert("Failed to update task status.");
            }
        }
    );

    deleteBtn.addEventListener("click", async () => {
            const confirmDelete = confirm( "Are you sure you want to delete this task?" );
            if (!confirmDelete) {
                return;
            }
            try {
                await db.collection("boards").doc(boardId)
                    .collection("tasks").doc(taskId).delete();

                const boardCard = document.querySelector(`[data-board-id="${boardId}"]`);
                if (boardCard) {
                    await loadBoardTasks(
                        boardId,
                        boardCard
                    );
                }
                await loadDashboardAnalytics();
            } catch (error) {
                console.error( "Delete task error:", error );
                alert( "Failed to delete task." );
            }
        }
    );
    taskList.appendChild(li);
}

// DASHBOARD ROLE
const userRoleSelect = document.getElementById("user-role-select");
// LOAD USER ROLE
async function loadUserRole() {
    const user = auth.currentUser;
    if (!user || !userRoleSelect) {
        return;
    }
    try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            userRoleSelect.value = data.role || "leader";
        }
    } catch (error) {
        console.error( "Load user role error:", error );
    }
}
// SAVE USER ROLE

if (userRoleSelect) {
    userRoleSelect.addEventListener("change", async () => {
            const user = auth.currentUser;
            if (!user) {
                return;
            }
            const selectedRole = userRoleSelect.value;
            try {
                await db.collection("users").doc(user.uid).update({
                        role: selectedRole
                    });
                if (currentUserData) {
                    currentUserData.role = selectedRole;
                }
            } catch (error) {
                console.error("Save role error:",error);
                alert("Failed to save role.");
            }
        }
    );
}
// DASHBOARD ANALYTICS

async function loadDashboardAnalytics() {
    const user = auth.currentUser;
    if (!user) {
        return;
    }
    try {
        const boardsSnapshot =
            await db.collection("boards").where("ownerId","==",user.uid).get();
        let totalTasks = 0;
        let doneTasks = 0;
        const totalBoards = boardsSnapshot.size;
        const performanceData = [];
        for ( const boardDoc of boardsSnapshot.docs) {
            const board = boardDoc.data();
            const tasksSnapshot = await db.collection("boards").doc(boardDoc.id).collection("tasks").get();
            let boardTotal = 0;
            let boardDone = 0;
            tasksSnapshot.forEach((taskDoc) => {
                    const task = taskDoc.data();
                    boardTotal++;
                    totalTasks++;
                    if ( task.status === "done") {
                        boardDone++;
                        doneTasks++;
                    }
                }
            );
            const percentage = boardTotal === 0 ? 0 : Math.round(( boardDone / boardTotal) * 100);
            performanceData.push({name: board.name, percentage});
        }
        const pendingTasks = totalTasks - doneTasks;
        const donePercentage = totalTasks === 0 ? 0 : Math.round((doneTasks /totalTasks) * 100);
        const pendingPercentage = totalTasks === 0 ? 0 : 100 - donePercentage;
        const totalTasksElement = document.getElementById("total-tasks-value");

        if (totalTasksElement) {
            totalTasksElement.innerText = totalTasks;
        }
        const totalProjectsElement = document.getElementById("total-projects-value");
        if (totalProjectsElement) {
            totalProjectsElement.innerText = totalBoards;
        }
        const donePercentageElement = document.getElementById("done-percentage");
        if (donePercentageElement) {
            donePercentageElement.innerText =`${donePercentage}%`;
        }
        const pendingPercentageElement = document.getElementById("pending-percentage");
        if (pendingPercentageElement) {
            pendingPercentageElement.innerText =`${pendingPercentage}%`;
        }
        const donut = document.getElementById("task-donut-chart");
        if (donut) {
            donut.style.background =
                `conic-gradient(
                    #00c853 0% ${donePercentage}%,
                    #ffab00 ${donePercentage}% 100%
                )`;
        }
        const barWrapper = document.getElementById( "performance-chart" );
        if (barWrapper) {
            barWrapper.innerHTML = "";
            if (performanceData.length === 0) {
                barWrapper.innerHTML = `
                    <div class="empty-chart">
                        <i class="fas fa-chart-bar"></i>
                        <p>
                            No project data yet.
                        </p>
                    </div>
                `;
            }
            performanceData.forEach((person) => {
                    const barGroup = document.createElement("div");
                    barGroup.className = "bar-group";
                    const bar = document.createElement("div");
                    bar.className ="bar";
                    bar.style.height =`${person.percentage}%`;
                    bar.style.background = person.percentage >= 70 ? "#00c853": person.percentage >= 40 ? "#ffab00" : "#ff3d71";
                    bar.innerHTML = `
                        <span>
                            ${person.percentage}%
                        </span>
                    `;
                    const name = document.createElement("small");
                    name.innerText = person.name;
                    barGroup.appendChild(bar);
                    barGroup.appendChild(name);
                    barWrapper.appendChild(barGroup);
                }
            );
        }
    } catch (error) {
        console.error("Analytics error:",error);
    }
}

// TEAMS MANAGEMENT
// ==========================================
// TEAM ELEMENTS

const createTeamBtn = document.getElementById("create-team-btn");
const createTeamModal = document.getElementById("create-team-modal");
const cancelTeamBtn = document.getElementById("cancel-team-btn");
const confirmCreateTeamBtn = document.getElementById("confirm-create-team-btn");
const teamNameInput = document.getElementById("team-name-input");
const teamsContainer = document.getElementById("teams-container");

// OPEN CREATE TEAM MODAL
if (createTeamBtn) {
    createTeamBtn.addEventListener("click",() => {
            createTeamModal.classList.remove("hidden");
            teamNameInput.value = "";
            teamNameInput.focus();
        }
    );
}

// CLOSE CREATE TEAM MODAL
if (cancelTeamBtn) {
    cancelTeamBtn.addEventListener("click",() => {
            createTeamModal.classList.add("hidden");
            teamNameInput.value = "";
        }
    );
}

// CREATE TEAM
if (confirmCreateTeamBtn) {
    confirmCreateTeamBtn.addEventListener("click",async () => {
            const teamName = teamNameInput.value.trim();
            const user = auth.currentUser;
            if (!teamName) {
                alert("Please enter a team name.");
                return;
            }
            if (!user) {
                alert("You must be logged in.");
                return;
            }
            try {
                const teamRef = await db.collection("teams").add({
                            name:teamName,
                            ownerId:user.uid,
                            ownerEmail:user.email,
                            createdAt:firebase.firestore.FieldValue.serverTimestamp()
                        });
                await teamRef.collection("members").doc(user.uid).set({
                        userId:user.uid,
                        name:currentUserData.username || user.email,
                        role:"Team Leader",
                        profilePicture:currentUserData.profilePicture || "",
                        isOwner:true,
                        joinedAt:firebase.firestore.FieldValue.serverTimestamp()
                    });
                createTeamModal.classList.add("hidden");
                teamNameInput.value = "";
                await loadUserTeams();
                alert("Team created successfully!");
            } catch (error) {
                console.error("Create team error:",error);
                alert("Failed to create team.");
            }
        }
    );
}

// LOAD USER TEAMS
async function loadUserTeams() {
    const user = auth.currentUser;
    if (!user || !teamsContainer) {
        return;
    }
    try {
        teamsContainer.innerHTML = "";
        const ownedTeamsSnapshot = await db.collection("teams").where("ownerId","==",user.uid).get();
        if (ownedTeamsSnapshot.empty) {
            teamsContainer.innerHTML = `
                <div class="team-frame">
                    <div class="empty-team-state">
                        <i class="fas fa-users"></i>
                        <h3>
                            No Teams Yet
                        </h3>
                        <p>
                            Create your first team
                            to get started.
                        </p>
                    </div>
                </div>
            `;
            return;
        }
        ownedTeamsSnapshot.forEach((teamDoc) => {
                createTeamCard(teamDoc.id,teamDoc.data());
            });
    } catch (error) {
        console.error("Load teams error:",error);
    }
}

// CREATE TEAM CARD
function createTeamCard(teamId,team) {
    const teamFrame =document.createElement("div");
    teamFrame.className = "team-frame";
    teamFrame.dataset.teamId = teamId;
    teamFrame.innerHTML = `
        <div class="team-header">
            <h3 class="team-title">
                ${escapeHTML(team.name)}
            </h3>
            <div class="team-header-actions">
                <button
                    class="add-member-btn"
                    data-team-id="${teamId}"
                >
                    <i class="fas fa-user-plus"></i>
                    Add Member
                </button>
                <button
                    class="delete-team-btn"
                    data-team-id="${teamId}"
                    title="Delete Team"
                >
                    <i class="fas fa-trash"></i>
                    Delete Team
                </button>
            </div>
        </div>
        <div class="members-grid">
            <div class="loading-members">
                Loading members...
            </div>
        </div>
    `;
    teamsContainer.appendChild(teamFrame);
    loadTeamMembers(teamId,teamFrame);
    const addMemberBtn = teamFrame.querySelector(".add-member-btn");
    if (addMemberBtn) {
        addMemberBtn.addEventListener("click",() => {
                openAddMemberModal(teamId);
            }
        );
    }
    const deleteTeamBtn = teamFrame.querySelector(".delete-team-btn");
    if (deleteTeamBtn) {
        deleteTeamBtn.addEventListener("click",async () => {
                await deleteTeam(teamId,teamFrame);
            }
        );
    }
}
// DELETE ENTIRE TEAM

async function deleteTeam(teamId,teamFrame) {
    const confirmDelete = confirm("Are you sure you want to delete this entire team? All team members will also be removed.");
    if (!confirmDelete) {
        return;
    }
    try {
        const membersSnapshot = await db.collection("teams").doc(teamId).collection("members").get();
        const batch = db.batch();
        membersSnapshot.forEach((memberDoc) => {
                batch.delete(memberDoc.ref);
            }
        );
        batch.delete(db.collection("teams").doc(teamId));
        await batch.commit();
        if (teamFrame) {
            teamFrame.remove();
        }
        await loadUserTeams();
        alert("Team deleted successfully!");
    } catch (error) {
        console.error("Delete team error:",error);
        alert("Failed to delete team.");
    }
}
// LOAD TEAM MEMBERS

async function loadTeamMembers(teamId,teamFrame) {
    const membersGrid = teamFrame.querySelector(".members-grid");
    if (!membersGrid) {
        return;
    }
    try {
        const membersSnapshot = await db.collection("teams").doc(teamId)
                .collection("members").orderBy("joinedAt","asc").get();

        membersGrid.innerHTML = "";
        if (membersSnapshot.empty) {
            membersGrid.innerHTML = `
                <p>
                    No members yet.
                </p>
            `;
            return;
        }
        membersSnapshot.forEach((memberDoc) => {
                const member = memberDoc.data();
                const memberCard = document.createElement("div");
                memberCard.className = "member-card";
                let avatarHTML = "";
                if (member.profilePicture) {
                    avatarHTML = `
                        <img
                            src="${member.profilePicture}"
                            alt="${escapeHTML(member.name)}"
                        >
                    `;
                } else {
                    avatarHTML = `
                        <div class="member-initials">
                            ${getInitials(member.name)}
                        </div>
                    `;
                }
                const deleteMemberButton =member.isOwner ? 
                "" : `
                            <button
                                class="delete-member-btn"
                                title="Delete Member"
                                data-member-id="${memberDoc.id}"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        `;
                memberCard.innerHTML = `
                    <div class="member-pic">
                        ${avatarHTML}
                    </div>
                    <h4>
                        ${escapeHTML(member.name)}
                    </h4>
                    <span>
                        ${escapeHTML(member.role)}
                    </span>
                    ${deleteMemberButton}
                `;
                membersGrid.appendChild(memberCard);

                const deleteMemberBtn = memberCard.querySelector(".delete-member-btn");
                if (deleteMemberBtn) {
                    deleteMemberBtn.addEventListener("click",async () => {
                            await deleteTeamMember(teamId,memberDoc.id,memberCard,member.name);
                        });
                }
            });

    } catch (error) {
        console.error("Load team members error:",error);
    }
}
// DELETE TEAM MEMBER

async function deleteTeamMember(teamId,memberId,memberCard,memberName) {
    const confirmDelete = confirm(`Are you sure you want to remove ${memberName} from this team?`);
    if (!confirmDelete) {
        return;
    }
    try {
        await db.collection("teams").doc(teamId).collection("members").doc(memberId).delete();
        if (memberCard) {
            memberCard.remove();
        }
        const teamFrame = document.querySelector(`[data-team-id="${teamId}"]`);
        if (teamFrame) {
            await loadTeamMembers(teamId,teamFrame);
        }
        alert("Member removed successfully!");
    } catch (error) {
        console.error("Delete member error:",error);
        alert("Failed to remove member.");
    }
}
// ADD TEAM MEMBER
const addMemberModal = document.getElementById("add-member-modal");
const cancelMemberBtn = document.getElementById("cancel-member-btn");
const confirmAddMemberBtn = document.getElementById("confirm-add-member-btn");
const friendSelect = document.getElementById("friend-select");
const memberRoleInput = document.getElementById("member-role-input");
let selectedTeamId = null;

// 1. LOAD FRIENDS INTO SELECT
async function loadFriendsForSelect() {
    const user = auth.currentUser || currentUser;
    if (!user || !friendSelect) return;

    friendSelect.innerHTML = `<option value="">Choose Friend</option>`;
    
    try {
        const friendsSnapshot = await db.collection("users").doc(user.uid).collection("friends").get();
        friendsSnapshot.forEach(doc => {
            const friend = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = friend.username || friend.email || "Friend";
            friendSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading friends for select:", error);
    }
}

// 2. OPEN ADD MEMBER MODAL
async function openAddMemberModal(teamId) {
    if (!addMemberModal) {
        console.error("add-member-modal element not found in HTML!");
        return;
    }
    selectedTeamId = teamId;
    if (memberRoleInput) memberRoleInput.value = "";
    if (friendSelect) friendSelect.value = "";
    
    await loadFriendsForSelect();
    addMemberModal.classList.remove("hidden");
}

// 3. CLOSE ADD MEMBER MODAL
if (cancelMemberBtn) {
    cancelMemberBtn.addEventListener("click", () => {
        if (addMemberModal) addMemberModal.classList.add("hidden");
        selectedTeamId = null;
    });
}

// 4. CONFIRM ADD MEMBER
if (confirmAddMemberBtn) {
    confirmAddMemberBtn.addEventListener("click", async () => {
        const user = auth.currentUser || currentUser;
        if (!selectedTeamId || !user) return;
        
        const friendId = friendSelect ? friendSelect.value : "";
        const role = memberRoleInput ? memberRoleInput.value.trim() : "";

        if (!friendId) {
            alert("Please choose a friend.");
            return;
        }
        if (!role) {
            alert("Please enter member role.");
            return;
        }

        try {
            // Check if friend already exists in team
            const existingMember = await db.collection("teams").doc(selectedTeamId).collection("members").doc(friendId).get();
            if (existingMember.exists) {
                alert("This friend is already a team member.");
                return;
            }

            // Get friend data
            const friendDoc = await db.collection("users").doc(user.uid).collection("friends").doc(friendId).get();
            if (!friendDoc.exists) {
                alert("Friend not found.");
                return;
            }

            const friend = friendDoc.data();
            await db.collection("teams").doc(selectedTeamId).collection("members").doc(friendId).set({
                userId: friendId,
                name: friend.username || "Member",
                role: role,
                profilePicture: friend.profilePicture || "",
                isOwner: false,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const teamFrame = document.querySelector(`[data-team-id="${selectedTeamId}"]`);
            if (teamFrame) {
                await loadTeamMembers(selectedTeamId, teamFrame);
            }

            addMemberModal.classList.add("hidden");
            selectedTeamId = null;
            alert("Member added successfully!");
        } catch (error) {
            console.error("Add member error:", error);
            alert("Failed to add member.");
        }
    });
}
// CONVERT FILE TO BASE64

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                    resolve(reader.result);
                };
            reader.onerror = (error) => {
                    reject(error);
                };
            reader.readAsDataURL(file);
        }
    );
}
// FRIENDS SYSTEM
const searchInput = document.getElementById("search-user-input");
const searchBtn = document.getElementById("search-user-btn");
const searchResults = document.getElementById("search-results");
const friendsList = document.getElementById("friends-list");
// Live Search
if (searchInput) {
    searchInput.addEventListener("input", async () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            searchResults.innerHTML = "";
            return;
        }
        try {
            const snapshot = await db.collection("users").get();
            searchResults.innerHTML = "";
            snapshot.forEach(doc => {
                if (doc.id === currentUser.uid) return;
                const user = doc.data();
                const username = (user.username || "").toLowerCase();
                if (username.includes(query)) {
                    createSearchCard(doc.id, user);
                }
            });
        } catch (error) {
            console.error("Search error:", error);
        }
    });
}
// Create Search Result Card
function createSearchCard(userId, user) {
    const card = document.createElement("div");
    card.className = "friend-card";
    card.innerHTML = `
        <div class="friend-info">
            <div class="friend-avatar">
                ${user.profilePicture
                    ? `<img src="${user.profilePicture}" alt="User">`
                    : getInitials(user.username)}
            </div>
            <div class="friend-data">
                <h4>${escapeHTML(user.username)}</h4>
                <span>${escapeHTML(user.email)}</span>
            </div>
        </div>
        <button class="add-friend-btn">
            Add Friend
        </button>
    `;
    const btn = card.querySelector(".add-friend-btn");
    btn.addEventListener("click", () => addFriend(userId, user));
    searchResults.appendChild(card);
}
// Add Friend
async function addFriend(friendId, friendData) {
    try {
        await db.collection("users").doc(currentUser.uid).collection("friends").doc(friendId).set({
                username: friendData.username,
                email: friendData.email,
                profilePicture: friendData.profilePicture || "",
                addedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        alert(`${friendData.username} added successfully!`);
        searchInput.value = "";
        searchResults.innerHTML = "";
        await loadFriends();
    } catch (error) {
        console.error("Add friend error:", error);
        alert("Failed to add friend.");
    }
}
// Load Friends List
async function loadFriends() {
    if (!friendsList || !currentUser) return;
    try {
        const snapshot = await db.collection("users").doc(currentUser.uid).collection("friends").orderBy("addedAt", "desc").get();
        friendsList.innerHTML = "";
        if (snapshot.empty) {
            friendsList.innerHTML = `
                <div class="empty-friends">
                    <i class="fas fa-user-friends"></i>
                    <p>No friends yet.</p>
                </div>
            `;
            return;
        }
        snapshot.forEach(doc => {
            const friend = doc.data();
            createFriendCard(doc.id, friend);
        });
    } catch (error) {
        console.error("Load friends error:", error);
    }
}
// Friend Card
function createFriendCard(friendId, friend) {
    const card = document.createElement("div");
    card.className = "friend-card";
    card.innerHTML = `
        <div class="friend-info">
            <div class="friend-avatar">
                ${friend.profilePicture
                    ? `<img src="${friend.profilePicture}" alt="Friend">`
                    : getInitials(friend.username)}
            </div>
            <div class="friend-data">
                <h4>${escapeHTML(friend.username)}</h4>
                <span>${escapeHTML(friend.email)}</span>
            </div>
        </div>
        <button class="remove-friend-btn">
            Remove
        </button>
    `;
    const removeBtn = card.querySelector(".remove-friend-btn");
    removeBtn.addEventListener("click", () => removeFriend(friendId));
    friendsList.appendChild(card);
}
// Remove Friend
async function removeFriend(friendId) {
    const confirmDelete = confirm("Remove this friend?");
    if (!confirmDelete) return;
    try {
        await db.collection("users").doc(currentUser.uid).collection("friends").doc(friendId).delete();
        await loadFriends();
    } catch (error) {
        console.error("Remove friend error:", error);
        alert("Failed to remove friend.");
    }
}
// ESCAPE HTML
function escapeHTML(value) {
    if (!value) {
        return "";
    }
    return String(value).replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
