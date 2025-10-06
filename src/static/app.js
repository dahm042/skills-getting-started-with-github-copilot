document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants list HTML with delete icon
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list" style="list-style-type:none; padding-left:0;">
                ${details.participants.map(p => `
                  <li class="participant-item">
                    <span>${p}</span>
                      <button class="delete-participant" title="Remove" data-activity="${name}" data-email="${p}" style="background:none;border:none;cursor:pointer;color:#c00;font-size:1.5em;margin-left:8px;line-height:1;">
                        <span class="remove-x">&times;</span>
                      </button>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <p class="no-participants">No participants yet.</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

    activitiesList.appendChild(activityCard);

    // Add option to select dropdown
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
      // Add event listeners for delete buttons
      document.querySelectorAll('.delete-participant').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const activity = btn.getAttribute('data-activity');
          const email = btn.getAttribute('data-email');
          showCustomAlert(`Remove <b>${email}</b> from <b>${activity}</b>?`, async () => {
            try {
              const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
                method: 'POST',
              });
              const result = await response.json();
              if (response.ok) {
                fetchActivities();
                showCustomAlert(`<span style='color:green;'>${email} was removed from ${activity}.</span>`);
              } else {
                showCustomAlert(result.detail || 'Failed to remove participant.', null, true);
              }
            } catch (err) {
              showCustomAlert('Error removing participant.', null, true);
            }
          });
        });
      });

      // Custom alert box function
      function showCustomAlert(message, onConfirm, isError) {
        let alertBox = document.getElementById('custom-alert-box');
        if (!alertBox) {
          alertBox = document.createElement('div');
          alertBox.id = 'custom-alert-box';
          alertBox.innerHTML = `
            <div class="custom-alert-content">
              <div class="custom-alert-message"></div>
              <div class="custom-alert-actions"></div>
            </div>
          `;
          document.body.appendChild(alertBox);
        }
        alertBox.style.display = 'flex';
        alertBox.className = isError ? 'custom-alert error' : 'custom-alert';
        alertBox.querySelector('.custom-alert-message').innerHTML = message;
        const actions = alertBox.querySelector('.custom-alert-actions');
        actions.innerHTML = '';
        if (onConfirm) {
          const confirmBtn = document.createElement('button');
          confirmBtn.textContent = 'Yes, remove';
          confirmBtn.className = 'custom-alert-confirm';
          confirmBtn.onclick = () => {
            alertBox.style.display = 'none';
            onConfirm();
          };
          actions.appendChild(confirmBtn);
          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.className = 'custom-alert-cancel';
          cancelBtn.onclick = () => {
            alertBox.style.display = 'none';
          };
          actions.appendChild(cancelBtn);
        } else {
          const closeBtn = document.createElement('button');
          closeBtn.textContent = 'Close';
          closeBtn.className = 'custom-alert-close';
          closeBtn.onclick = () => {
            alertBox.style.display = 'none';
          };
          actions.appendChild(closeBtn);
        }
      }
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-participant').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const activity = btn.getAttribute('data-activity');
        const email = btn.getAttribute('data-email');
        if (confirm(`Remove ${email} from ${activity}?`)) {
          try {
            const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
              method: 'POST',
            });
            const result = await response.json();
            if (response.ok) {
              fetchActivities();
            } else {
              alert(result.detail || 'Failed to remove participant.');
            }
          } catch (err) {
            alert('Error removing participant.');
          }
        }
      });
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
