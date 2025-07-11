#!/bin/bash

# Navy Display System - Oracle Linux Setup Script
# Complete environment setup for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="20"
APP_USER="navydisplay"
APP_DIR="/opt/navy-display"
SERVICE_NAME="navy-display"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Function to print colored output
log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log $RED "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to detect Oracle Linux version
detect_os() {
    if [[ -f /etc/oracle-release ]]; then
        local version=$(cat /etc/oracle-release | grep -oP '\d+\.\d+')
        log $GREEN "Detected Oracle Linux $version"
        return 0
    elif [[ -f /etc/redhat-release ]]; then
        log $YELLOW "Detected RHEL-compatible system"
        return 0
    else
        log $RED "This script is designed for Oracle Linux/RHEL systems"
        exit 1
    fi
}

# Function to update system packages
update_system() {
    log $BLUE "Updating system packages..."
    dnf update -y
    dnf install -y epel-release
    dnf groupinstall -y "Development Tools"
}

# Function to install Node.js
install_nodejs() {
    log $BLUE "Installing Node.js $NODE_VERSION..."
    
    # Install NodeSource repository
    curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
    
    # Install Node.js
    dnf install -y nodejs
    
    # Verify installation
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    log $GREEN "Node.js installed: $node_version"
    log $GREEN "npm installed: $npm_version"
    
    # Install global packages
    npm install -g pm2
}

# Function to install system dependencies
install_dependencies() {
    log $BLUE "Installing system dependencies..."
    
    dnf install -y \
        git \
        curl \
        wget \
        unzip \
        nginx \
        firewalld \
        policycoreutils-python-utils \
        python3 \
        python3-pip \
        google-chrome-stable \
        chromedriver
    
    # Install Python packages for testing
    pip3 install selenium requests
}

# Function to install Chrome for testing
install_chrome() {
    log $BLUE "Installing Google Chrome for testing..."
    
    # Add Google Chrome repository
    cat > /etc/yum.repos.d/google-chrome.repo << 'EOF'
[google-chrome]
name=google-chrome
baseurl=http://dl.google.com/linux/chrome/rpm/stable/x86_64
enabled=1
gpgcheck=1
gpgkey=https://dl.google.com/linux/linux_signing_key.pub
EOF
    
    dnf install -y google-chrome-stable
    
    # Install ChromeDriver
    CHROME_VERSION=$(google-chrome --version | grep -oP '\d+\.\d+\.\d+')
    CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION%.*}")
    
    wget -O /tmp/chromedriver.zip "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip"
    unzip /tmp/chromedriver.zip -d /tmp/
    mv /tmp/chromedriver /usr/local/bin/
    chmod +x /usr/local/bin/chromedriver
    
    log $GREEN "Chrome and ChromeDriver installed"
}

# Function to create application user
create_app_user() {
    log $BLUE "Creating application user..."
    
    if ! id "$APP_USER" &>/dev/null; then
        useradd -r -s /bin/false -d $APP_DIR $APP_USER
        log $GREEN "Created user: $APP_USER"
    else
        log $YELLOW "User $APP_USER already exists"
    fi
}

# Function to setup application directory
setup_app_directory() {
    log $BLUE "Setting up application directory..."
    
    mkdir -p $APP_DIR
    chown $APP_USER:$APP_USER $APP_DIR
    chmod 755 $APP_DIR
    
    log $GREEN "Application directory created: $APP_DIR"
}

# Function to configure firewall
configure_firewall() {
    log $BLUE "Configuring firewall..."
    
    systemctl enable firewalld
    systemctl start firewalld
    
    # Open required ports
    firewall-cmd --permanent --add-port=5000/tcp  # Application port
    firewall-cmd --permanent --add-port=80/tcp    # HTTP
    firewall-cmd --permanent --add-port=443/tcp   # HTTPS
    firewall-cmd --permanent --add-service=ssh
    
    firewall-cmd --reload
    
    log $GREEN "Firewall configured"
}

# Function to configure Nginx
configure_nginx() {
    log $BLUE "Configuring Nginx..."
    
    # Create nginx configuration
    cat > /etc/nginx/conf.d/navy-display.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Test nginx configuration
    nginx -t
    
    # Enable and start nginx
    systemctl enable nginx
    systemctl restart nginx
    
    log $GREEN "Nginx configured and started"
}

# Function to create systemd service
create_systemd_service() {
    log $BLUE "Creating systemd service..."
    
    cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Navy Display System
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=5000
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    log $GREEN "Systemd service created: $SERVICE_NAME"
}

# Function to setup log rotation
setup_logging() {
    log $BLUE "Setting up log rotation..."
    
    mkdir -p /var/log/navy-display
    chown $APP_USER:$APP_USER /var/log/navy-display
    
    cat > /etc/logrotate.d/navy-display << 'EOF'
/var/log/navy-display/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 navydisplay navydisplay
    postrotate
        systemctl reload navy-display
    endscript
}
EOF
    
    log $GREEN "Log rotation configured"
}

# Function to configure SELinux
configure_selinux() {
    log $BLUE "Configuring SELinux..."
    
    # Allow nginx to connect to backend
    setsebool -P httpd_can_network_connect 1
    
    # Allow nginx to serve files from app directory
    semanage fcontext -a -t httpd_exec_t "$APP_DIR(/.*)?"
    restorecon -R $APP_DIR
    
    log $GREEN "SELinux configured"
}

# Function to create deployment script
create_deployment_script() {
    log $BLUE "Creating deployment script..."
    
    cat > /usr/local/bin/deploy-navy-display << EOF
#!/bin/bash

# Navy Display System Deployment Script

set -e

APP_DIR="$APP_DIR"
SERVICE_NAME="$SERVICE_NAME"
APP_USER="$APP_USER"
BACKUP_DIR="/var/backups/navy-display"

log() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1"
}

# Create backup
create_backup() {
    log "Creating backup..."
    mkdir -p \$BACKUP_DIR
    if [ -d "\$APP_DIR" ]; then
        tar -czf "\$BACKUP_DIR/backup-\$(date +%Y%m%d-%H%M%S).tar.gz" -C \$APP_DIR .
    fi
}

# Deploy application
deploy() {
    local repo_url=\$1
    
    if [ -z "\$repo_url" ]; then
        log "Usage: deploy-navy-display <git_repository_url>"
        exit 1
    fi
    
    log "Starting deployment..."
    
    # Stop service
    systemctl stop \$SERVICE_NAME || true
    
    # Create backup
    create_backup
    
    # Clone or update repository
    if [ -d "\$APP_DIR/.git" ]; then
        log "Updating existing repository..."
        cd \$APP_DIR
        git pull origin main
    else
        log "Cloning repository..."
        rm -rf \$APP_DIR/*
        git clone \$repo_url \$APP_DIR
        cd \$APP_DIR
    fi
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --production
    
    # Build application
    log "Building application..."
    npm run build
    
    # Set permissions
    chown -R \$APP_USER:\$APP_USER \$APP_DIR
    
    # Start service
    log "Starting service..."
    systemctl start \$SERVICE_NAME
    systemctl status \$SERVICE_NAME
    
    log "Deployment completed successfully!"
}

# Run deployment
deploy "\$1"
EOF
    
    chmod +x /usr/local/bin/deploy-navy-display
    
    log $GREEN "Deployment script created: /usr/local/bin/deploy-navy-display"
}

# Function to create monitoring script
create_monitoring_script() {
    log $BLUE "Creating monitoring script..."
    
    cat > /usr/local/bin/monitor-navy-display << 'EOF'
#!/bin/bash

# Navy Display System Monitoring Script

SERVICE_NAME="navy-display"
APP_URL="http://localhost:5000"
LOG_FILE="/var/log/navy-display/monitor.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

check_service() {
    if systemctl is-active --quiet $SERVICE_NAME; then
        return 0
    else
        return 1
    fi
}

check_health() {
    if curl -s "$APP_URL/api/health" >/dev/null; then
        return 0
    else
        return 1
    fi
}

restart_service() {
    log "Restarting service: $SERVICE_NAME"
    systemctl restart $SERVICE_NAME
    sleep 10
}

# Main monitoring logic
if ! check_service; then
    log "Service is not running, starting..."
    systemctl start $SERVICE_NAME
    sleep 10
fi

if ! check_health; then
    log "Health check failed, restarting service..."
    restart_service
    
    if check_health; then
        log "Service recovered successfully"
    else
        log "Service failed to recover, manual intervention required"
        exit 1
    fi
else
    log "Service is healthy"
fi
EOF
    
    chmod +x /usr/local/bin/monitor-navy-display
    
    # Create cron job for monitoring
    cat > /etc/cron.d/navy-display-monitor << 'EOF'
# Monitor Navy Display System every 5 minutes
*/5 * * * * root /usr/local/bin/monitor-navy-display
EOF
    
    log $GREEN "Monitoring script created with cron job"
}

# Function to run tests
run_tests() {
    log $BLUE "Running system tests..."
    
    # Make test scripts executable
    chmod +x test.sh
    chmod +x test_selenium.py
    
    # Run bash tests
    log $YELLOW "Running bash tests..."
    ./test.sh
    
    # Run Python/Selenium tests
    log $YELLOW "Running Selenium tests..."
    python3 test_selenium.py
    
    log $GREEN "All tests completed"
}

# Function to display summary
display_summary() {
    log $GREEN "============================================"
    log $GREEN "Navy Display System Setup Complete!"
    log $GREEN "============================================"
    echo
    log $CYAN "System Information:"
    echo "  • Application Directory: $APP_DIR"
    echo "  • Service Name: $SERVICE_NAME"
    echo "  • Application User: $APP_USER"
    echo "  • Web Port: 80 (proxied to 5000)"
    echo
    log $CYAN "Management Commands:"
    echo "  • Deploy: /usr/local/bin/deploy-navy-display <git_url>"
    echo "  • Monitor: /usr/local/bin/monitor-navy-display"
    echo "  • Service: systemctl {start|stop|restart|status} $SERVICE_NAME"
    echo "  • Logs: journalctl -u $SERVICE_NAME -f"
    echo
    log $CYAN "Testing Commands:"
    echo "  • Bash Tests: ./test.sh"
    echo "  • Selenium Tests: python3 test_selenium.py"
    echo
    log $YELLOW "Next Steps:"
    echo "  1. Deploy your application: deploy-navy-display <your_git_repo>"
    echo "  2. Configure your domain in nginx"
    echo "  3. Set up SSL certificate (recommended)"
    echo "  4. Configure monitoring alerts"
    echo
}

# Main execution function
main() {
    log $BLUE "Starting Navy Display System setup for Oracle Linux..."
    
    check_root
    detect_os
    update_system
    install_nodejs
    install_dependencies
    install_chrome
    create_app_user
    setup_app_directory
    configure_firewall
    configure_nginx
    create_systemd_service
    setup_logging
    configure_selinux
    create_deployment_script
    create_monitoring_script
    
    display_summary
    
    log $GREEN "Setup completed successfully!"
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --test-only    Run tests only (requires existing setup)"
        exit 0
        ;;
    --test-only)
        run_tests
        exit 0
        ;;
esac

# Run main function
main "$@"