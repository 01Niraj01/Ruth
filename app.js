
  // --- State Management Object ---
  const state = {
    currentUser: null,
    jobs: [],
    applications: [],
    filteredJobs: [],
    currentPage: 1,
    jobsPerPage: 5,
    applyingJobId: null,
    users: {},
    useAPI: false, // Flag to toggle between local and API jobs

    init() {
      this.currentUser = localStorage.getItem('currentUser');
      this.jobs = JSON.parse(localStorage.getItem('jobs')) || [];
      this.applications = JSON.parse(localStorage.getItem('applications')) || [];
      this.users = JSON.parse(localStorage.getItem('users')) || {};

      // Initialize with sample jobs if empty
      if (this.jobs.length === 0) {
        this.jobs = [
          {
            id: '1',
            title: 'Registered Nurse',
            company: 'HealthCare Plus',
            location: 'Los Angeles, CA',
            type: 'Full-time',
            description: 'Provide patient care, administer medications, and collaborate with healthcare teams to ensure quality treatment.',
            postedBy: 'hr@healthcareplus.com',
            postedDate: new Date().toISOString(),
            isExternal: false
          },
          {
            id: '2',
            title: 'Software Engineer',
            company: 'Innovatech Solutions',
            location: 'San Francisco, CA',
            type: 'Full-time',
            description: 'Develop and maintain web applications, collaborate with cross-functional teams, and implement new features.',
            postedBy: 'jobs@innovatech.com',
            postedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
            isExternal: false
          },
          {
            id: '3',
            title: 'Logistics Coordinator',
            company: 'Global Freight',
            location: 'Chicago, IL',
            type: 'Full-time',
            description: 'Manage shipping schedules, coordinate with carriers, and ensure timely delivery of goods.',
            postedBy: 'contact@globalfreight.com',
            postedDate: new Date(Date.now() - 86400000 * 5).toISOString(),
            isExternal: false
          },
          {
            id: '4',
            title: 'Marketing Specialist',
            company: 'Bright Ideas Agency',
            location: 'New York, NY',
            type: 'Part-time',
            description: 'Plan and execute marketing campaigns, analyze market trends, and create engaging content.',
            postedBy: 'marketing@brightideas.com',
            postedDate: new Date(Date.now() - 86400000 * 7).toISOString(),
            isExternal: false
          },
          {
            id: '5',
            title: 'Manufacturing Technician',
            company: 'Precision Manufacturing',
            location: 'Detroit, MI',
            type: 'Full-time',
            description: 'Operate machinery, perform quality checks, and maintain production schedules.',
            postedBy: 'hr@precisionmfg.com',
            postedDate: new Date(Date.now() - 86400000 * 10).toISOString(),
            isExternal: false
          }
        ];
      }

      // Initialize with sample application if user exists
      if (this.applications.length === 0 && this.currentUser) {
        this.applications = [{
          id: '1',
          jobId: '1',
          jobTitle: 'Campus Ambassador',
          company: 'TechStart Inc.',
          applicantName: this.currentUser.split('@')[0],
          applicantEmail: this.currentUser,
          coverLetter: 'I would love to represent TechStart on campus as I have experience with event organization and social media marketing.',
          status: 'Under Review',
          date: new Date(Date.now() - 86400000 * 3).toISOString()
        }];
      }

      this.filteredJobs = [...this.jobs];
      this.save();
    },

    save() {
      localStorage.setItem('jobs', JSON.stringify(this.jobs));
      localStorage.setItem('applications', JSON.stringify(this.applications));
      localStorage.setItem('users', JSON.stringify(this.users));
      if (this.currentUser) {
        localStorage.setItem('currentUser', this.currentUser);
      } else {
        localStorage.removeItem('currentUser');
      }
    },

    hashPassword(p) {
      let hash = 0;
      for (let i = 0; i < p.length; i++) {
        hash = (hash << 5) - hash + p.charCodeAt(i);
        hash &= hash; // Convert to 32bit integer
      }
      return hash.toString(36);
    },

    isValidEmail(email) { 
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); 
    },
    
    isValidPassword(password) { 
      return password.length >= 6; 
    },

    filterJobs(search = '', location = '', type = '') {
      this.filteredJobs = this.jobs.filter(job => {
        const matchSearch = search === '' || 
          job.title.toLowerCase().includes(search.toLowerCase()) || 
          job.company.toLowerCase().includes(search.toLowerCase()) || 
          job.location.toLowerCase().includes(search.toLowerCase());
        
        const matchLoc = location === '' || 
          job.location.toLowerCase().includes(location.toLowerCase());
        
        const matchType = type === '' || 
          (job.type && job.type.toLowerCase() === type.toLowerCase());
        
        return matchSearch && matchLoc && matchType;
      });
      this.currentPage = 1;
    },

    getPaginatedJobs() {
      const start = (this.currentPage - 1) * this.jobsPerPage;
      return this.filteredJobs.slice(start, start + this.jobsPerPage);
    },

    getTotalPages() {
      return Math.ceil(this.filteredJobs.length / this.jobsPerPage);
    },

    /**
     * Fetch jobs from external API using RapidAPI jsearch endpoint.
     * Note: You need a valid RapidAPI key to use this feature.
     * Replace 'YOUR_RAPIDAPI_KEY_HERE' with your own API key.
     * You can get a free API key by signing up at https://rapidapi.com/
     */
    async fetchJobsFromAPI(query = 'developer jobs in chicago', location = '') {
      showLoader(true);
      try {
        const response = await fetch(
          `https://jsearch.p.rapidapi.com/search?query=developer%20jobs%20in%20chicago&page=1&num_pages=1&country=us&date_posted=all`,
          {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': '7c9d418be4msh5cfae30c115844cp1f3581jsn5899bc44c5e9',
              'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if data exists and has the expected structure
        if (!data || !data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid API response structure');
        }
        
        // Convert API jobs to our format with proper null checks
        const apiJobs = data.data.map(job => ({
          id: job.job_id || `api-${Math.random().toString(36).substr(2, 9)}`,
          title: job.job_title || 'No title available',
          company: job.employer_name || 'Company not specified',
          location: [
            job.job_city || '',
            job.job_country || ''
          ].filter(Boolean).join(', ') || 'Location not specified',
          type: job.job_employment_type || 'Not specified',
          description: job.job_description || 'No description available',
          postedDate: job.job_posted_at_timestamp 
            ? new Date(job.job_posted_at_timestamp * 1000).toISOString()
            : new Date().toISOString(),
          isExternal: true,
          applyLink: job.job_apply_link || '#'
        }));
        
        // Merge with existing jobs
        this.jobs = [...apiJobs, ...this.jobs.filter(j => !j.isExternal)];
        this.filterJobs();
        this.save();
        return true;
      } catch (error) {
        console.error('API Error:', error);
        showAlert('Failed to fetch jobs from API. Showing local listings instead.', 'error');
        return false;
      } finally {
        showLoader(false);
      }
    }
  };

  // --- Utility Functions ---
  function showLoader(show = true) {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
  }

  function showAlert(message, type = 'success', duration = 5000) {
    const alertEl = document.createElement('div');
    alertEl.className = `alert ${type}`;
    alertEl.textContent = message;
    document.getElementById('alertContainer').appendChild(alertEl);
    setTimeout(() => alertEl.remove(), duration);
  }

  function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    document.querySelector(`#${modalId} input`).focus();
  }

  function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }

  // --- Core Application Functions ---
  function renderJobs() {
    const jobsList = document.getElementById('jobsList');
    jobsList.innerHTML = '';

    const jobs = state.getPaginatedJobs();
    if (jobs.length === 0) {
      jobsList.innerHTML = '<div class="card"><p style="text-align:center;">No jobs found matching your criteria.</p></div>';
      return;
    }

    jobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'card';
      
      if (job.isExternal) {
        // External job from API
        card.innerHTML = `
          <h3>${job.title}</h3>
          <p><strong>${job.company}</strong> • ${job.location} • ${job.type}</p>
          <p>${job.description.slice(0, 200)}${job.description.length > 200 ? '...' : ''}</p>
          <small>Posted: ${new Date(job.postedDate).toLocaleDateString()}</small><br>
          <a href="${job.applyLink}" target="_blank" rel="noopener noreferrer" class="apply-btn">
            Apply on ${job.company}
          </a>
        `;
      } else {
        // Local job posting
        card.innerHTML = `
          <h3>${job.title}</h3>
          <p><strong>${job.company}</strong> • ${job.location} • ${job.type}</p>
          <p>${job.description}</p>
          <small>Posted on: ${new Date(job.postedDate).toLocaleDateString()}</small><br>
          <button class="apply-btn" onclick="openApplyModal('${job.id}')">
            Apply Now
          </button>
        `;
      }
      
      jobsList.appendChild(card);
    });

    renderPagination();
  }

  function renderPagination() {
    const totalPages = state.getTotalPages();
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&laquo;';
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderJobs();
      }
    });
    pagination.appendChild(prevBtn);

    // Page buttons
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === state.currentPage ? 'active' : '';
      btn.addEventListener('click', () => {
        state.currentPage = i;
        renderJobs();
      });
      pagination.appendChild(btn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&raquo;';
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (state.currentPage < totalPages) {
        state.currentPage++;
        renderJobs();
      }
    });
    pagination.appendChild(nextBtn);
  }

  function renderApplications() {
    const container = document.getElementById('applicationsList');
    container.innerHTML = '';

    const apps = state.applications.filter(app => app.applicantEmail === state.currentUser);
    if (apps.length === 0) {
      container.innerHTML = '<div class="card"><p style="text-align:center;">No applications submitted yet.</p></div>';
      return;
    }

    apps.forEach(app => {
      const job = state.jobs.find(j => j.id === app.jobId) || {};
      const card = document.createElement('div');
      card.className = 'card';
      
      let statusClass = '';
      if (app.status === 'Accepted') statusClass = 'background:#4caf50; color:white;';
      else if (app.status === 'Rejected') statusClass = 'background:#f44336; color:white;';
      else statusClass = 'background:#e0e0e0;';
      
      card.innerHTML = `
        <h3>${app.jobTitle}</h3>
        <p><strong>${app.company}</strong></p>
        <div class="job-meta">
          <div>
            <i class="fas fa-calendar-alt"></i>
            <span>Applied: ${new Date(app.date).toLocaleDateString()}</span>
          </div>
          <div>
            <i class="fas fa-info-circle"></i>
            <span>Status: <span class="status-badge" style="${statusClass}">${app.status}</span></span>
          </div>
        </div>
        ${job.description ? `<p>${job.description.slice(0, 100)}...</p>` : ''}
        <button onclick="viewApplicationDetails('${app.id}')" class="apply-btn" style="background:#3f51b5;">
          View Details
        </button>
      `;
      container.appendChild(card);
    });
  }

  function viewApplicationDetails(appId) {
    const app = state.applications.find(a => a.id === appId);
    if (!app) return showAlert('Application not found', 'error');
    
    const job = state.jobs.find(j => j.id === app.jobId) || {};
    
    let statusClass = '';
    if (app.status === 'Accepted') statusClass = 'background:#4caf50; color:white;';
    else if (app.status === 'Rejected') statusClass = 'background:#f44336; color:white;';
    else statusClass = 'background:#e0e0e0;';
    
    const modalContent = `
      <button class="close-btn" onclick="closeModal('appDetailsModal')" aria-label="Close">&times;</button>
      <h3><i class="fas fa-file-alt"></i> Application Details</h3>
      
      <div style="text-align:left; background:#f5f5f5; padding:1rem; border-radius:6px; margin-bottom:1.5rem;">
        <h4 style="margin-top:0;">${app.jobTitle}</h4>
        <p><strong>${app.company}</strong></p>
        <p>Status: <span class="status-badge" style="${statusClass}">${app.status}</span></p>
        <p>Applied on: ${new Date(app.date).toLocaleDateString()}</p>
      </div>
      
      <h4 style="text-align:left; margin-bottom:0.5rem;">Your Cover Letter:</h4>
      <div style="text-align:left; background:white; border:1px solid #eee; padding:1rem; border-radius:6px; margin-bottom:1.5rem;">
        ${app.coverLetter}
      </div>
      
      ${job.description ? `
      <h4 style="text-align:left; margin-bottom:0.5rem;">Job Description:</h4>
      <div style="text-align:left; background:white; border:1px solid #eee; padding:1rem; border-radius:6px; margin-bottom:1.5rem;">
        ${job.description}
      </div>
      ` : ''}
      
      <button class="submit-btn" onclick="closeModal('appDetailsModal')">
        <i class="fas fa-times"></i> Close
      </button>
    `;
    
    // Create or update modal
    let modal = document.getElementById('appDetailsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'appDetailsModal';
      modal.className = 'modal';
      modal.innerHTML = `<div class="modal-content">${modalContent}</div>`;
      document.body.appendChild(modal);
    } else {
      modal.innerHTML = `<div class="modal-content">${modalContent}</div>`;
    }
    
    openModal('appDetailsModal');
  }

  function openApplyModal(jobId) {
    if (!state.currentUser) {
      showAlert('Please login to apply for jobs.', 'error');
      openModal('loginModal');
      return;
    }
    
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) {
      showAlert('Job not found', 'error');
      return;
    }

    state.applyingJobId = jobId;
    document.getElementById('applyJobInfo').innerHTML = `
      <strong>${job.title}</strong><br>
      ${job.company} • ${job.location}<br>
      Type: ${job.type}
    `;

    // Pre-fill user info if available
    const user = state.users[state.currentUser];
    if (user) {
      document.getElementById('applicantName').value = user.name || state.currentUser.split('@')[0];
      document.getElementById('applicantEmail').value = state.currentUser;
    }

    // Clear previous inputs
    document.getElementById('resumeUpload').value = '';
    document.getElementById('applicantMessage').value = '';

    openModal('applyModal');
  }

  function submitApplication() {
    const name = document.getElementById('applicantName').value.trim();
    const email = document.getElementById('applicantEmail').value.trim();
    const resume = document.getElementById('resumeUpload').files[0];
    const cover = document.getElementById('applicantMessage').value.trim();
    const jobId = state.applyingJobId;

    // Validation
    if (!name || !email || !cover || !resume) {
      showAlert('Please fill all required fields', 'error');
      return;
    }

    // Validate email format
    if (!state.isValidEmail(email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }

    // Validate resume file
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resume.type)) {
      showAlert('Please upload a PDF or Word document', 'error');
      return;
    }

    if (resume.size > 2 * 1024 * 1024) {
      showAlert('File size should be less than 2MB', 'error');
      return;
    }

    showLoader(true);
    
    // Simulate processing delay
    setTimeout(() => {
      const job = state.jobs.find(j => j.id === jobId);
      if (!job) {
        showLoader(false);
        showAlert('Job not found', 'error');
        return;
      }

      // Create new application
      const newApp = {
        id: Date.now().toString(),
        jobId,
        jobTitle: job.title,
        company: job.company,
        applicantName: name,
        applicantEmail: email,
        resumeFileName: resume.name,
        coverLetter: cover,
        status: 'Under Review',
        date: new Date().toISOString()
      };

      state.applications.unshift(newApp);
      state.save();

      showLoader(false);
      closeModal('applyModal');
      showAlert('Application submitted successfully!', 'success');
      renderApplications();
    }, 1500);
  }

  // --- Open Apply Modal ---
  function openApplyModal(jobId) {
    if (!state.currentUser) {
      showAlert('Please login to apply for jobs.', 'error');
      openModal('loginModal');
      return;
    }
    
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) {
      showAlert('Job not found', 'error');
      return;
    }

    state.applyingJobId = jobId;
    document.getElementById('applyModalTitle').textContent = `Apply to Job: ${job.title}`;
    document.getElementById('applyModalDesc').textContent = `${job.company} • ${job.location} • ${job.type}`;

    // Pre-fill user info if available
    const user = state.users[state.currentUser];
    if (user) {
      document.getElementById('applicantName').value = user.name || state.currentUser.split('@')[0];
      document.getElementById('applicantEmail').value = state.currentUser;
    } else {
      document.getElementById('applicantName').value = '';
      document.getElementById('applicantEmail').value = '';
    }

    // Clear previous inputs
    document.getElementById('resumeUpload').value = '';
    document.getElementById('applicantMessage').value = '';

    openModal('applyModal');
  }

  function postJob() {
    const title = document.getElementById('jobTitle').value.trim();
    const company = document.getElementById('company').value.trim();
    const location = document.getElementById('location').value.trim();
    const type = document.getElementById('jobType').value.trim();
    const description = document.getElementById('jobDescription').value.trim();

    // Validate all fields
    if (!title || !company || !location || !type || !description) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    // Create new job
    const newJob = {
      id: Date.now().toString(),
      title,
      company,
      location,
      type,
      description,
      postedBy: state.currentUser,
      postedDate: new Date().toISOString(),
      isExternal: false
    };

    state.jobs.unshift(newJob);
    state.filterJobs();
    state.save();

    // Reset form
    document.getElementById('postJobForm').reset();
    
    showAlert('Job posted successfully!', 'success');
    showPage('browse');
    renderJobs();
  }

  function loginUser() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!state.isValidEmail(email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }

    if (!state.isValidPassword(password)) {
      showAlert('Password must be at least 6 characters', 'error');
      return;
    }

    const user = state.users[email];
    if (!user || user.passwordHash !== state.hashPassword(password)) {
      showAlert('Invalid email or password', 'error');
      return;
    }

    state.currentUser = email;
    state.save();
    closeModal('loginModal');
    onLogin();
    showAlert(`Welcome back, ${user.name || email.split('@')[0]}!`, 'success');
  }

  function signupUser() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!state.isValidEmail(email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }

    if (!state.isValidPassword(password)) {
      showAlert('Password must be at least 6 characters', 'error');
      return;
    }

    if (state.users[email]) {
      showAlert('Email already registered. Please login instead.', 'error');
      return;
    }

    // Create new user
    state.users[email] = {
      email,
      passwordHash: state.hashPassword(password),
      name: email.split('@')[0]
    };

    state.currentUser = email;
    state.save();
    closeModal('loginModal');
    onLogin();
    showAlert(`Account created successfully! Welcome, ${state.users[email].name}!`, 'success');
  }

  function logoutUser() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    state.currentUser = null;
    state.save();
    
    document.getElementById('landingPage').style.display = 'flex';
    document.getElementById('mainNav').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
    document.getElementById('header-subtext').textContent = 'Student Job Portal';
    showPage('landingPage');
    showAlert('Logged out successfully', 'success');
  }

  function onLogin() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainNav').style.display = 'flex';
    document.getElementById('footer').style.display = 'block';
    
    const userName = state.users[state.currentUser]?.name || state.currentUser.split('@')[0];
    document.getElementById('header-subtext').textContent = `Welcome, ${userName}`;
    
    showPage('browse');
    renderJobs();
    renderApplications();
  }

  function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Update nav links
    document.querySelectorAll('nav a[data-page]').forEach(a => {
      a.classList.toggle('active', a.dataset.page === pageId);
      a.setAttribute('aria-current', a.dataset.page === pageId ? 'page' : 'false');
    });
    
    // Special handling for certain pages
    if (pageId === 'browse') {
      renderJobs();
    } else if (pageId === 'track') {
      renderApplications();
    }
  }

  function handleJobSearch() {
    const search = document.getElementById('jobSearch').value;
    const location = document.getElementById('locationFilter').value;
    const type = document.getElementById('typeFilter').value;
    
    if (state.useAPI) {
      // Use API search
      const query = search || 'student';
      state.fetchJobsFromAPI(query, location).then(success => {
        if (success) {
          state.filterJobs(search, location, type);
          renderJobs();
        }
      });
    } else {
      // Use local search
      state.filterJobs(search, location, type);
      renderJobs();
    }
  }

  function toggleJobSource(useAPI) {
    state.useAPI = useAPI;
    state.currentPage = 1;
    handleJobSearch();
  }

  // --- Initialize Application ---
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize state
    state.init();
    
    // Set up event listeners
    document.querySelectorAll('nav a[data-page]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        showPage(a.dataset.page);
      });
    });
    
    document.getElementById('logoutBtn').addEventListener('click', e => {
      e.preventDefault();
      logoutUser();
    });
    
    document.getElementById('postJobForm').addEventListener('submit', e => {
      e.preventDefault();
      postJob();
    });
    
    // Search and filter handlers
    document.getElementById('jobSearch').addEventListener('input', handleJobSearch);
    document.getElementById('locationFilter').addEventListener('change', handleJobSearch);
    document.getElementById('typeFilter').addEventListener('change', handleJobSearch);
    
    // Check if user is already logged in
    if (state.currentUser) {
      onLogin();
    }

    // Run critical-path tests after initialization
    runCriticalPathTests();
  });

  // --- Testing Functions ---
  function runCriticalPathTests() {
    console.group('Critical Path Tests');

    // Test 1: Jobs array is populated
    if (state.jobs && state.jobs.length > 0) {
      console.log('Test 1 Passed: Jobs array is populated with', state.jobs.length, 'jobs.');
    } else {
      console.error('Test 1 Failed: Jobs array is empty.');
    }

    // Test 2: Render jobs populates jobsList container
    renderJobs();
    const jobsList = document.getElementById('jobsList');
    if (jobsList && jobsList.children.length > 0) {
      console.log('Test 2 Passed: jobsList container has', jobsList.children.length, 'job cards.');
    } else {
      console.error('Test 2 Failed: jobsList container is empty after renderJobs.');
    }

    // Test 3: Pagination buttons exist if needed
    const pagination = document.getElementById('pagination');
    if (pagination) {
      if (pagination.children.length > 0) {
        console.log('Test 3 Passed: Pagination buttons rendered.');
      } else {
        console.warn('Test 3 Warning: No pagination buttons rendered (may be okay if only one page).');
      }
    } else {
      console.error('Test 3 Failed: Pagination container not found.');
    }

    console.groupEnd();
  }

  // --- Utility to clear saved jobs data and reload ---
  function clearJobsData() {
    localStorage.removeItem('jobs');
    localStorage.removeItem('filteredJobs');
    localStorage.removeItem('applications');
    localStorage.removeItem('users');
    localStorage.removeItem('currentUser');
    console.log('LocalStorage job data cleared. Reloading page...');
    location.reload();
  }
