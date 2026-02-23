#!/bin/bash
set -e

# ============================================================
# BetterWindowsOS — Bootable ISO Builder (Electron Edition)
# Run in WSL2: sudo bash build-iso.sh
# Produces: webos.iso (bootable in VirtualBox / bare metal)
#
# Creates a minimal Debian live Linux system that boots
# directly into the Electron app. Linux is completely hidden:
#   - Custom Plymouth boot splash (no Linux text)
#   - Auto-login straight into the Electron app
#   - All terminals/escape routes disabled
#   - App auto-restarts on crash
# ============================================================

ISO_NAME="webosv2.iso"
PROJECT_DIR="$(pwd)"
# Use native ext4 filesystem for debootstrap/chroot (NTFS can't handle Linux perms/symlinks)
WORK="/tmp/webos-iso-build"
ROOTFS="$WORK/rootfs"
ISODIR="$WORK/isodir"
APP_NAME="BetterWindowsOS"

echo "╔══════════════════════════════════════════════╗"
echo "║   BetterWindowsOS — ISO Builder (Electron)   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# --- Must be root ---
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root: sudo bash build-iso.sh"
  exit 1
fi

# --- Step 1: Build the web app + package Electron for Linux ---
echo "[1/10] Building web app and packaging Electron for Linux..."

if [ ! -d "node_modules" ]; then
  echo "  Installing npm dependencies..."
  npm install --legacy-peer-deps 2>/dev/null || su -c "npm install --legacy-peer-deps" "$SUDO_USER" 2>/dev/null || true
fi

echo "  Building Vite app..."
npx vite build 2>/dev/null || su -c "npx vite build" "$SUDO_USER"

if [ ! -f "dist/index.html" ]; then
  echo "ERROR: Vite build failed — dist/index.html not found."
  exit 1
fi

echo "  Packaging Electron app for Linux..."
npx electron-builder --config electron-builder.json --linux --dir 2>/dev/null \
  || su -c "npx electron-builder --config electron-builder.json --linux --dir" "$SUDO_USER"

ELECTRON_DIST="$PROJECT_DIR/release/linux-unpacked"
if [ ! -d "$ELECTRON_DIST" ]; then
  echo "ERROR: Electron build failed — release/linux-unpacked/ not found."
  exit 1
fi
echo "  ✓ Electron app packaged"

# --- Step 2: Install ISO build tools ---
echo "[2/10] Installing build tools..."
apt-get update -qq
apt-get install -y -qq \
  xorriso squashfs-tools grub-pc-bin grub-common grub2-common \
  mtools wget debootstrap

# --- Step 3: Bootstrap minimal Debian ---
echo "[3/10] Bootstrapping Debian rootfs (this takes a few minutes)..."
rm -rf "$WORK"
mkdir -p "$ROOTFS" "$ISODIR/boot/grub"

debootstrap --arch=amd64 --variant=minbase \
  bookworm "$ROOTFS" https://deb.debian.org/debian

# --- Step 4: Install system packages + Plymouth ---
echo "[4/10] Installing system packages..."

mount --bind /dev "$ROOTFS/dev"
mount --bind /dev/pts "$ROOTFS/dev/pts"
mount -t proc proc "$ROOTFS/proc"
mount -t sysfs sysfs "$ROOTFS/sys"
cp /etc/resolv.conf "$ROOTFS/etc/resolv.conf"

chroot "$ROOTFS" /bin/bash << 'CHROOT_EOF'
set -e
export DEBIAN_FRONTEND=noninteractive

cat > /etc/apt/sources.list << 'APT'
deb https://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb https://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
APT

apt-get update -qq

# Core system + X server + Electron deps + Plymouth for boot splash
apt-get install -y -qq --no-install-recommends \
  live-boot \
  systemd systemd-sysv dbus udev \
  linux-image-amd64 \
  xserver-xorg xserver-xorg-video-all xserver-xorg-input-all xinit x11-xserver-utils \
  fonts-noto fonts-noto-color-emoji fonts-liberation fonts-dejavu-core \
  pulseaudio alsa-utils \
  dbus-x11 \
  libgtk-3-0 libnss3 libatk-bridge2.0-0 libdrm2 libgbm1 \
  libxss1 libasound2 libxshmfence1 libgl1-mesa-dri mesa-utils \
  libnotify4 libsecret-1-0 \
  network-manager net-tools iproute2 wireless-tools wpasupplicant \
  plymouth plymouth-themes \
  sudo bash locales \
  unclutter kbd

echo "en_US.UTF-8 UTF-8" > /etc/locale.gen
locale-gen

# Create the kiosk user
useradd -m -s /bin/bash -G audio,video,input,netdev,render webos
echo "webos:webos" | chpasswd
echo "webos ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# ---- LOCKDOWN ----

# Auto-login on tty1 only
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf << 'GETTY'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin webos --noclear %I $TERM
Type=idle
GETTY

# Disable all other TTYs
for i in 2 3 4 5 6; do
  systemctl mask "getty@tty${i}.service"
done

# Disable Ctrl+Alt+Delete
systemctl mask ctrl-alt-del.target
ln -sf /dev/null /etc/systemd/system/ctrl-alt-del.target

# Brand the system
echo "BetterWindowsOS" > /etc/hostname
echo "127.0.0.1 BetterWindowsOS" >> /etc/hosts

# Overwrite all OS identification
cat > /etc/os-release << 'OSREL'
PRETTY_NAME="BetterWindowsOS"
NAME="BetterWindowsOS"
ID=betterwindowsos
VERSION="1.0"
HOME_URL="https://betterwindowsos.local"
OSREL

echo "BetterWindowsOS" > /etc/issue
echo "BetterWindowsOS" > /etc/issue.net
echo "" > /etc/motd

systemctl enable NetworkManager

CHROOT_EOF

# --- Step 5: Create custom Plymouth boot splash theme ---
echo "[5/10] Creating custom boot splash screen..."

THEME_DIR="$ROOTFS/usr/share/plymouth/themes/betterwindowsos"
mkdir -p "$THEME_DIR"

# Theme descriptor
cat > "$THEME_DIR/betterwindowsos.plymouth" << 'PLYTHEME'
[Plymouth Theme]
Name=BetterWindowsOS
Description=BetterWindowsOS Boot Splash
ModuleName=script

[script]
ImageDir=/usr/share/plymouth/themes/betterwindowsos
ScriptFile=/usr/share/plymouth/themes/betterwindowsos/betterwindowsos.script
PLYTHEME

# Generate the logo as an SVG then convert to PNG inside the chroot
# First create a simple but nice logo using raw pixel data
# We'll create it with a script that draws using Plymouth's built-in capabilities

# Create the boot animation script (Plymouth scripting language)
cat > "$THEME_DIR/betterwindowsos.script" << 'PLYSCRIPT'
# BetterWindowsOS Plymouth Boot Theme
# Animated loading screen with logo and spinner

# ---- Background ----
Window.SetBackgroundTopColor(0.04, 0.05, 0.12);
Window.SetBackgroundBottomColor(0.02, 0.02, 0.06);

# ---- Screen dimensions ----
screen_width = Window.GetWidth();
screen_height = Window.GetHeight();

# ---- Logo text (drawn as image if available, fallback to text) ----
logo_image = Image("logo.png");
if (logo_image) {
    logo_sprite = Sprite(logo_image);
    logo_width = logo_image.GetWidth();
    logo_height = logo_image.GetHeight();
    logo_sprite.SetX(screen_width / 2 - logo_width / 2);
    logo_sprite.SetY(screen_height / 2 - logo_height / 2 - 60);
    logo_sprite.SetOpacity(1.0);
}

# ---- Spinner dots ----
num_dots = 5;
dot_spacing = 24;
dot_y = screen_height / 2 + 80;
dot_start_x = screen_width / 2 - (num_dots * dot_spacing) / 2;

# Create dot images (small circles)
for (i = 0; i < num_dots; i++) {
    dots[i].image = Image("dot.png");
    dots[i].sprite = Sprite(dots[i].image);
    dots[i].sprite.SetX(dot_start_x + i * dot_spacing);
    dots[i].sprite.SetY(dot_y);
    dots[i].sprite.SetOpacity(0.2);
}

# ---- "Loading..." text ----
loading_image = Image("loading.png");
if (loading_image) {
    loading_sprite = Sprite(loading_image);
    loading_sprite.SetX(screen_width / 2 - loading_image.GetWidth() / 2);
    loading_sprite.SetY(dot_y + 40);
    loading_sprite.SetOpacity(0.6);
}

# ---- Animation state ----
global.progress_val = 0;
global.tick = 0;

# ---- Refresh callback (called ~50 times/sec) ----
fun refresh_callback() {
    global.tick++;

    # Animate spinner dots in a wave pattern
    for (i = 0; i < num_dots; i++) {
        # Create a wave effect: each dot lights up in sequence
        phase = (global.tick / 8.0 + i * 1.2) % (num_dots * 1.2);
        if (phase < 1.2)
            opacity = 0.3 + 0.7 * (1.0 - phase / 1.2);
        else
            opacity = 0.2;

        dots[i].sprite.SetOpacity(opacity);
    }
}

Plymouth.SetRefreshFunction(refresh_callback);

# ---- Boot progress callback ----
fun boot_progress_callback(duration, progress) {
    global.progress_val = progress;
}

Plymouth.SetBootProgressFunction(boot_progress_callback);

# ---- Hide messages/password prompts ----
fun message_callback(text) {
    # Swallow all messages — don't show any Linux text
}

Plymouth.SetMessageFunction(message_callback);

fun display_password_callback(prompt, num_bullets) {
    # No password prompt
}

Plymouth.SetDisplayPasswordFunction(display_password_callback);

fun display_question_callback(prompt, entry) {
    # No question prompts
}

Plymouth.SetDisplayQuestionFunction(display_question_callback);
PLYSCRIPT

# Generate the logo PNG and dot PNG using Python inside the chroot
# Install python3 temporarily for image generation
chroot "$ROOTFS" /bin/bash << 'IMGEOF'
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get install -y -qq --no-install-recommends python3 python3-pil

python3 << 'PYEOF'
from PIL import Image, ImageDraw, ImageFont
import os

theme_dir = "/usr/share/plymouth/themes/betterwindowsos"

# --- Create logo.png (text-based logo) ---
width, height = 600, 120
img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Try to find a nice font, fallback to default
font = None
font_paths = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
]
for fp in font_paths:
    if os.path.exists(fp):
        font = ImageFont.truetype(fp, 48)
        break
if font is None:
    font = ImageFont.load_default()

# Draw the main title with a subtle glow effect
text = "BetterWindowsOS"

# Get text bounding box for centering
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
tx = (width - tw) // 2
ty = (height - th) // 2

# Glow layers (blue tint)
for offset in range(4, 0, -1):
    alpha = int(40 / offset)
    glow_color = (80, 140, 255, alpha)
    draw.text((tx - offset, ty), text, fill=glow_color, font=font)
    draw.text((tx + offset, ty), text, fill=glow_color, font=font)
    draw.text((tx, ty - offset), text, fill=glow_color, font=font)
    draw.text((tx, ty + offset), text, fill=glow_color, font=font)

# Main text (white)
draw.text((tx, ty), text, fill=(255, 255, 255, 255), font=font)

# Subtitle
subfont = None
for fp in font_paths:
    if os.path.exists(fp):
        subfont = ImageFont.truetype(fp, 16)
        break
if subfont is None:
    subfont = ImageFont.load_default()

sub_text = "Starting up..."
sbbox = draw.textbbox((0, 0), sub_text, font=subfont)
stw = sbbox[2] - sbbox[0]
draw.text(((width - stw) // 2, ty + th + 16), sub_text, fill=(160, 180, 220, 200), font=subfont)

img.save(os.path.join(theme_dir, "logo.png"))

# --- Create dot.png (small circle for spinner) ---
dot_size = 12
dot_img = Image.new("RGBA", (dot_size, dot_size), (0, 0, 0, 0))
dot_draw = ImageDraw.Draw(dot_img)
dot_draw.ellipse([0, 0, dot_size - 1, dot_size - 1], fill=(100, 160, 255, 255))
dot_img.save(os.path.join(theme_dir, "dot.png"))

# --- Create loading.png ---
lw, lh = 200, 30
limg = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
ldraw = ImageDraw.Draw(limg)
lfont = subfont
lt = "Loading BetterWindowsOS"
lbbox = ldraw.textbbox((0, 0), lt, font=lfont)
ltw = lbbox[2] - lbbox[0]
ldraw.text(((lw - ltw) // 2, 4), lt, fill=(140, 160, 200, 180), font=lfont)
limg.save(os.path.join(theme_dir, "loading.png"))

print("Boot splash images created successfully")
PYEOF

# Set the custom theme as default
plymouth-set-default-theme -R betterwindowsos

# Remove python3 to save space (it was only needed for image generation)
apt-get remove -y -qq python3 python3-pil
apt-get autoremove -y -qq

# Rebuild initramfs with the Plymouth theme baked in
update-initramfs -u

IMGEOF

echo "  ✓ Custom boot splash created"

# --- Step 6: Copy Electron app into rootfs ---
echo "[6/10] Installing Electron app into rootfs..."
mkdir -p "$ROOTFS/opt/betterwindowsos"
cp -r "$ELECTRON_DIST/"* "$ROOTFS/opt/betterwindowsos/"
chmod +x "$ROOTFS/opt/betterwindowsos/$APP_NAME"

chroot "$ROOTFS" chown -R root:root /opt/betterwindowsos
chroot "$ROOTFS" chmod -R 755 /opt/betterwindowsos

# --- Step 7: Create kiosk startup scripts ---
echo "[7/10] Creating kiosk auto-start scripts..."

# .xinitrc — launches Electron in fullscreen kiosk, restarts on crash
cat > "$ROOTFS/home/webos/.xinitrc" << 'XINIT'
#!/bin/sh

# Disable screen saver / power management
xset s off
xset -dpms
xset s noblank

# Hide cursor after 3s inactivity
unclutter -idle 3 -root &

# Disable Ctrl+Alt+Backspace (kill X)
setxkbmap -option ""

# Wait for X to fully start
sleep 1

# Launch Electron app — loop to auto-restart on crash
while true; do
  /opt/betterwindowsos/BetterWindowsOS \
    --no-sandbox \
    --kiosk \
    --disable-dev-shm-usage \
    --disable-gpu-sandbox \
    --start-fullscreen \
    --disable-infobars \
    --disable-session-crashed-bubble \
    2>/dev/null

  sleep 2
done
XINIT

chmod +x "$ROOTFS/home/webos/.xinitrc"
chroot "$ROOTFS" chown webos:webos /home/webos/.xinitrc

# .bash_profile — auto-starts X on tty1 login (no escape)
cat > "$ROOTFS/home/webos/.bash_profile" << 'PROFILE'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  exec startx 2>/dev/null
fi
PROFILE

chroot "$ROOTFS" chown webos:webos /home/webos/.bash_profile

# --- Step 8: X server lockdown ---
echo "[8/10] Locking down X server..."

cat > "$ROOTFS/etc/X11/Xwrapper.config" << 'XWRAP'
allowed_users=anybody
needs_root_rights=yes
XWRAP

# Prevent VT switching and Ctrl+Alt+Backspace
mkdir -p "$ROOTFS/etc/X11/xorg.conf.d"
cat > "$ROOTFS/etc/X11/xorg.conf.d/99-lockdown.conf" << 'XCONF'
Section "ServerFlags"
    Option "DontVTSwitch" "true"
    Option "DontZap"      "true"
EndSection
XCONF

# Watchdog systemd service (backup — restarts Electron if .xinitrc loop fails)
cat > "$ROOTFS/etc/systemd/system/betterwindowsos.service" << 'SVCEOF'
[Unit]
Description=BetterWindowsOS Kiosk
After=graphical.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=webos
Environment=DISPLAY=:0
ExecStart=/opt/betterwindowsos/BetterWindowsOS --no-sandbox --kiosk --disable-dev-shm-usage --start-fullscreen
Restart=always
RestartSec=3

[Install]
WantedBy=graphical.target
SVCEOF

# --- Step 9: Build squashfs + assemble ISO ---
echo "[9/10] Building compressed filesystem (this takes a while)..."

# Unmount chroot binds
umount "$ROOTFS/sys" 2>/dev/null || true
umount "$ROOTFS/proc" 2>/dev/null || true
umount "$ROOTFS/dev/pts" 2>/dev/null || true
umount "$ROOTFS/dev" 2>/dev/null || true

# Clean up caches to reduce ISO size
rm -rf "$ROOTFS/var/lib/apt/lists/"*
rm -rf "$ROOTFS/var/cache/apt/archives/"*.deb
rm -rf "$ROOTFS/var/cache/apt/"*.bin
rm -rf "$ROOTFS/tmp/"*
rm -rf "$ROOTFS/var/tmp/"*
rm -rf "$ROOTFS/usr/share/doc/"*
rm -rf "$ROOTFS/usr/share/man/"*

# Copy kernel + initramfs
KERNEL=$(ls "$ROOTFS/boot/vmlinuz-"* | sort -V | tail -1)
INITRD=$(ls "$ROOTFS/boot/initrd.img-"* | sort -V | tail -1)
cp "$KERNEL" "$ISODIR/boot/vmlinuz"
cp "$INITRD" "$ISODIR/boot/initrd.img"

# Build squashfs (live-boot expects /live/filesystem.squashfs)
mkdir -p "$ISODIR/live"
mksquashfs "$ROOTFS" "$ISODIR/live/filesystem.squashfs" -comp xz -quiet

# GRUB config — zero timeout, no menu, Plymouth splash
cat > "$ISODIR/boot/grub/grub.cfg" << 'GRUB'
set timeout=0
set default=0

menuentry "BetterWindowsOS" {
    linux /boot/vmlinuz boot=live toram quiet splash \
        loglevel=0 vt.global_cursor_default=0 consoleblank=0 \
        plymouth.enable=1
    initrd /boot/initrd.img
}
GRUB

# --- Step 10: Create the final ISO ---
echo "[10/10] Creating bootable ISO..."
grub-mkrescue -o "$WORK/$ISO_NAME" "$ISODIR"

cp "$WORK/$ISO_NAME" "$PROJECT_DIR/$ISO_NAME"

SIZE=$(du -h "$PROJECT_DIR/$ISO_NAME" | cut -f1)
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✓ ISO created: $ISO_NAME ($SIZE)               "
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║  VirtualBox setup:                               ║"
echo "║    1. New VM → Type: Linux, Debian 64-bit        ║"
echo "║    2. 2+ GB RAM, 128 MB video memory             ║"
echo "║    3. Enable 3D acceleration (Display tab)       ║"
echo "║    4. Storage → mount webos.iso as CD/DVD        ║"
echo "║    5. Boot → you'll see the BetterWindowsOS      ║"
echo "║       splash then go straight into the app       ║"
echo "║                                                  ║"
echo "║  What's inside:                                  ║"
echo "║    • Minimal Debian Linux (hidden)               ║"
echo "║    • Custom boot splash (no Linux text)          ║"
echo "║    • Electron app auto-starts in fullscreen      ║"
echo "║    • All escape routes disabled                  ║"
echo "║    • Auto-restarts on crash                      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
