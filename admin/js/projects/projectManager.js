const PROJECT_STORAGE_KEY = "harmonia.projects";

function createProjectId() {
    return (
        "project_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2, 8)
    );
}

const defaultProjects = [
    {
        id: createProjectId(),

        title: "Fall 2026 Student Government",

        description:
            "Plan and execute the Student Government academic year.",

        status: "active",

        progress: 25,

        color: "#1E4D8C",

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()
    },

    {
        id: createProjectId(),

        title: "The Harmonia Project",

        description:
            "Develop Harmonia into a sustainable nonprofit organization.",

        status: "planning",

        progress: 12,

        color: "#3D6FA8",

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()
    }
];

let projects = [];

function saveProjects() {
    localStorage.setItem(
        PROJECT_STORAGE_KEY,
        JSON.stringify(projects)
    );
}

window.HarmoniaProjects = {

    load() {

        const saved =
            localStorage.getItem(PROJECT_STORAGE_KEY);

        if (saved) {

            try {

                projects = JSON.parse(saved);

            } catch {

                projects = [...defaultProjects];

                saveProjects();
            }

        } else {

            projects = [...defaultProjects];

            saveProjects();

        }

    },

  getAll() {
    return [...projects];
},

getById(id) {
    return projects.find(
        project => project.id === id
    ) || null;
},

save() {
    saveProjects();
},

    add(project) {

        const item = {

            id: createProjectId(),

            progress: 0,

            color: "#1E4D8C",

            createdAt: new Date().toISOString(),

            updatedAt: new Date().toISOString(),

            ...project

        };

        projects.push(item);

        saveProjects();

        return item;

    },

    update(id, updates) {

        const index =
            projects.findIndex(project => project.id === id);

        if (index === -1) return;

        projects[index] = {

            ...projects[index],

            ...updates,

            updatedAt: new Date().toISOString()

        };

        saveProjects();

    },

    delete(id) {

        projects =
            projects.filter(project => project.id !== id);

        saveProjects();

    }

};