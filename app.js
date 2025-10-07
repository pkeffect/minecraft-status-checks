// Theme Management
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeIcon = this.themeToggle.querySelector('.theme-icon');
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme);
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            this.themeIcon.textContent = '☀️';
        } else {
            document.body.classList.remove('light-theme');
            this.themeIcon.textContent = '🌙';
        }
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }
}

// Status Checker
class MojangStatusChecker {
    constructor() {
        this.autoRefresh = false;
        this.refreshInterval = null;
        this.lastCheckTime = null;
        
        this.services = {
            "🎮 Core Services": {
                "Session Server (Auth)": {
                    url: "https://sessionserver.mojang.com/session/minecraft/profile/853c80ef3c3749fdaa49938b674adae6",
                    expected: [200]
                },
                "Minecraft Services API": {
                    url: "https://api.minecraftservices.com/minecraft/profile/lookup/name/jeb_",
                    expected: [200]
                },
                "Blocked Servers List": {
                    url: "https://sessionserver.mojang.com/blockedservers",
                    expected: [200]
                }
            },
            "📦 Download Services": {
                "Version Manifest (Primary)": {
                    url: "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json",
                    expected: [200]
                },
                "Version Manifest (Legacy)": {
                    url: "https://launchermeta.mojang.com/mc/game/version_manifest.json",
                    expected: [200]
                },
                "Libraries Server": {
                    url: "https://libraries.minecraft.net/com/mojang/authlib/3.16.29/authlib-3.16.29.jar",
                    expected: [200]
                },
                "Launcher Content": {
                    url: "https://launchercontent.mojang.com/v2/javaPatchNotes.json",
                    expected: [200]
                }
            },
            "🎨 Assets & Textures": {
                "Textures Server": {
                    url: "https://textures.minecraft.net/version/1",
                    expected: [200, 404]
                }
            },
            "🔧 Legacy APIs": {
                "Mojang API (Legacy)": {
                    url: "https://api.mojang.com/users/profiles/minecraft/jeb_",
                    expected: [200, 403]
                }
            },
            "🔐 Authentication": {
                "Xbox Live Auth": {
                    url: "https://user.auth.xboxlive.com/user/authenticate",
                    expected: [400, 415]
                },
                "XSTS Token Service": {
                    url: "https://xsts.auth.xboxlive.com/xsts/authorize",
                    expected: [400, 415]
                }
            }
        };
        
        this.elements = {
            checkBtn: document.getElementById('check-status-btn'),
            autoRefreshBtn: document.getElementById('auto-refresh-btn'),
            exportBtn: document.getElementById('export-btn'),
            statusContainer: document.getElementById('status-container'),
            totalServices: document.getElementById('total-services'),
            onlineServices: document.getElementById('online-services'),
            offlineServices: document.getElementById('offline-services'),
            mcVersion: document.getElementById('mc-version'),
            lastCheck: document.getElementById('last-check')
        };
        
        this.init();
    }
    
    init() {
        this.elements.checkBtn.addEventListener('click', () => this.checkStatus());
        this.elements.autoRefreshBtn.addEventListener('click', () => this.toggleAutoRefresh());
        this.elements.exportBtn.addEventListener('click', () => this.exportResults());
        
        // Render empty status cards immediately
        this.renderEmptyStatus();
        
        // Initial check
        this.checkStatus();
    }
    
    renderEmptyStatus() {
        this.elements.statusContainer.innerHTML = '';
        
        Object.entries(this.services).forEach(([category, services]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'card status-category';
            
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = category;
            categoryDiv.appendChild(header);
            
            Object.keys(services).forEach((name) => {
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.innerHTML = `
                    <div class="service-name">⏳ ${name}</div>
                    <div class="service-status">
                        <span class="status-text" style="color: var(--text-muted);">Checking...</span>
                    </div>
                `;
                categoryDiv.appendChild(serviceItem);
            });
            
            this.elements.statusContainer.appendChild(categoryDiv);
        });
    }
    
    async checkService(url, expected) {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            // no-cors returns opaque response, assume online if no error
            return { status: 'ONLINE', code: null };
        } catch (error) {
            return { status: 'OFFLINE', code: 0 };
        }
    }
    
    async checkStatus() {
        this.elements.checkBtn.disabled = true;
        this.elements.checkBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></span> Checking...';
        
        try {
            const results = {
                services: {},
                stats: { total: 0, online: 0, offline: 0 },
                version: await this.getLatestVersion(),
                timestamp: new Date().toISOString()
            };
            
            for (const [category, services] of Object.entries(this.services)) {
                results.services[category] = {};
                
                for (const [name, config] of Object.entries(services)) {
                    const result = await this.checkService(config.url, config.expected);
                    results.services[category][name] = result;
                    
                    results.stats.total++;
                    if (result.status === 'ONLINE') {
                        results.stats.online++;
                    } else {
                        results.stats.offline++;
                    }
                }
            }
            
            this.lastCheckTime = new Date();
            this.updateLastCheckTime();
            this.renderStatus(results);
            this.updateMetrics(results);
            
            const existingErrors = this.elements.statusContainer.querySelectorAll('.alert-danger');
            existingErrors.forEach(err => err.remove());
            
        } catch (error) {
            console.error('Status check error:', error);
            this.showError('Failed to check status: ' + error.message);
        } finally {
            this.elements.checkBtn.disabled = false;
            this.elements.checkBtn.innerHTML = '🔄 Check Status';
        }
    }
    
    async getLatestVersion() {
        try {
            const response = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
            const data = await response.json();
            return data.latest?.release || 'Unknown';
        } catch {
            return 'Unable to fetch';
        }
    }
    
    renderStatus(data) {
        this.elements.statusContainer.innerHTML = '';
        
        Object.entries(data.services).forEach(([category, services]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'card status-category';
            
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = category;
            categoryDiv.appendChild(header);
            
            Object.entries(services).forEach(([name, status]) => {
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                
                const statusClass = status.status === 'ONLINE' ? 'status-online' : 
                                   status.status.includes('ISSUES') ? 'status-issues' : 'status-offline';
                
                const icon = status.status === 'ONLINE' ? '✅' : 
                            status.status.includes('ISSUES') ? '⚠️' : '❌';
                
                serviceItem.innerHTML = `
                    <div class="service-name">${icon} ${name}</div>
                    <div class="service-status">
                        <span class="status-text ${statusClass}">${status.status}</span>
                        ${status.code ? `<span class="status-code">[${status.code}]</span>` : ''}
                    </div>
                `;
                
                categoryDiv.appendChild(serviceItem);
            });
            
            this.elements.statusContainer.appendChild(categoryDiv);
        });
    }
    
    updateMetrics(data) {
        this.elements.totalServices.textContent = data.stats.total;
        this.elements.onlineServices.textContent = data.stats.online;
        this.elements.offlineServices.textContent = data.stats.offline;
        this.elements.mcVersion.textContent = data.version || 'N/A';
    }
    
    updateLastCheckTime() {
        if (this.lastCheckTime) {
            const now = new Date();
            const diff = Math.floor((now - this.lastCheckTime) / 1000);
            
            let timeStr;
            if (diff < 60) {
                timeStr = `${diff} seconds ago`;
            } else if (diff < 3600) {
                timeStr = `${Math.floor(diff / 60)} minutes ago`;
            } else {
                timeStr = this.lastCheckTime.toLocaleTimeString();
            }
            
            this.elements.lastCheck.textContent = `Last checked: ${timeStr}`;
        }
    }
    
    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;
        
        if (this.autoRefresh) {
            this.elements.autoRefreshBtn.innerHTML = '⏱️ Auto-refresh: ON';
            this.elements.autoRefreshBtn.classList.remove('btn-secondary');
            this.elements.autoRefreshBtn.classList.add('btn-success');
            
            this.refreshInterval = setInterval(() => {
                this.checkStatus();
                this.updateLastCheckTime();
            }, 30000); // 30 seconds
        } else {
            this.elements.autoRefreshBtn.innerHTML = '⏱️ Auto-refresh: OFF';
            this.elements.autoRefreshBtn.classList.remove('btn-success');
            this.elements.autoRefreshBtn.classList.add('btn-secondary');
            
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        }
    }
    
    exportResults() {
        const results = {
            services: this.services,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mojang-status-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger';
        alert.innerHTML = `<span>❌</span><span>${message}</span>`;
        
        this.elements.statusContainer.insertBefore(alert, this.elements.statusContainer.firstChild);
        
        setTimeout(() => alert.remove(), 5000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new MojangStatusChecker();
    
    // Update "last checked" time every 10 seconds
    setInterval(() => {
        const checker = window.mojangChecker;
        if (checker) {
            checker.updateLastCheckTime();
        }
    }, 10000);
});

// Store checker instance globally
window.mojangChecker = null;
document.addEventListener('DOMContentLoaded', () => {
    window.mojangChecker = new MojangStatusChecker();
});