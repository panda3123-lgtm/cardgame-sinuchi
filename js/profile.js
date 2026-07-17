/**
 * プレイヤープロフィール管理システム
 */
const ProfileSystem = {
    profile: {
        name: "名無しの調査員",
        title: "新米調査員",
        winCount: 0
    },

    init() {
        this.loadProfile();
        this.setupEventListeners();
        this.renderProfile();
    },

    setupEventListeners() {
        const saveBtn = document.getElementById('btn-save-profile');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProfile());
        }
    },

    renderProfile() {
        const nameInput = document.getElementById('profile-name-input');
        const titleDisplay = document.getElementById('current-title-display');
        
        if (nameInput) nameInput.value = this.profile.name;
        if (titleDisplay) titleDisplay.textContent = this.profile.title;
    },

    saveProfile() {
        const nameInput = document.getElementById('profile-name-input');
        if (nameInput && nameInput.value.trim() !== "") {
            this.profile.name = nameInput.value.trim();
            localStorage.setItem('errata_profile', JSON.stringify(this.profile));
            alert("プロフィールを更新しました。");
        }
    },

    loadProfile() {
        const stored = localStorage.getItem('errata_profile');
        if (stored) {
            this.profile = JSON.parse(stored);
        }
        Game.userProfile = this.profile;
    },

    // 勝利数を加算する処理
    addWin() {
        this.profile.winCount++;
        if (this.profile.winCount >= 1) {
            this.profile.title = "一人前の調査員";
            if (typeof MissionSystem !== 'undefined') {
                MissionSystem.triggerCheck('m003'); // 初勝利ミッション達成
            }
        }
        localStorage.setItem('errata_profile', JSON.stringify(this.profile));
        this.renderProfile();
    }
};
