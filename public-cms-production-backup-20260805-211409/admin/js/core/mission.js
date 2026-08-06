(function initializeHarmoniaMission() {
    if (!window.Harmonia) {
        console.error(
            "Harmonia core must load before mission.js."
        );
        return;
    }

    Harmonia.Mission = {
        name: "The Harmonia Project",

        purpose:
            "Build greater community harmony through dialogue, connection, and action.",

        vision:
            "Create experiences and institutions that are beautiful, meaningful, collaborative, dignified, and capable of producing lasting community connection.",

        principles: [
            "dignity",
            "dialogue",
            "connection",
            "collaboration",
            "beauty",
            "intentionality",
            "access",
            "lasting impact"
        ],

        experienceQualities: [
            "beautiful",
            "exhilarating",
            "safe",
            "grounded",
            "welcoming",
            "thoughtful"
        ],

        avoid: [
            "performative charity",
            "generic programming",
            "activity without purpose",
            "institutional coldness",
            "one-sided community engagement",
            "short-term visibility without lasting impact"
        ],

        evaluationCriteria: {
    connection: {
        weight: 1,
        description:
            "Creates meaningful relationships between people, communities, or institutions."
    },

    dignity: {
        weight: 1,
        description:
            "Treats participants as collaborators rather than recipients or symbols."
    },

    dialogue: {
        weight: 1,
        description:
            "Encourages exchange, listening, and mutual understanding."
    },

    collaboration: {
        weight: 1,
        description:
            "Builds shared ownership across people or organizations."
    },

    distinctiveness: {
        weight: 1,
        description:
            "Feels intentional and recognizably aligned with Harmonia."
    },

    experience: {
        weight: 1,
        description:
            "Creates a thoughtful, beautiful, welcoming, and grounded experience."
    },

    longevity: {
        weight: 1,
        description:
            "Produces value or relationships that continue beyond the project."
    },

    communityVoice: {
        weight: 1,
        description:
            "Allows the affected community to shape the project."
    }
}
    };

    console.log("✅ Harmonia Mission Loaded");
})();