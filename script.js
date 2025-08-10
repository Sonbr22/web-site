document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const contentArea = document.getElementById('content-area');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Hide all tabs
            tabContents.forEach(content => content.classList.remove('active'));
            // Deactivate all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));

            // Activate the clicked button
            button.classList.add('active');

            // Show the corresponding tab content
            const tabId = button.dataset.tab;
            const activeTab = document.getElementById(tabId);
            if (activeTab) {
                activeTab.classList.add('active');
            }
            // Scroll content to top on tab change
            contentArea.scrollTop = 0;
        });
    });
});

