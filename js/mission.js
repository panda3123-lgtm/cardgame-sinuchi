/**
 * ミッション・実績管理システム
 */
const MissionSystem = {
    init() {
        this.renderMissions();
    },

    // ミッション一覧を画面に表示する
    renderMissions() {
        const container = document.getElementById('mission-list-container');
        if (!container) return;
        container.innerHTML = '';

        Game.userMissions.forEach(mission => {
            const item = document.createElement('div');
            item.className = `mission-item ${mission.achieved ? 'achieved' : ''}`;
            item.style.padding = '10px';
            item.style.margin = '10px 0';
            item.style.background = mission.achieved ? 'rgba(0, 255, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)';
            item.style.borderLeft = `5px solid ${mission.achieved ? '#00ff80' : '#555'}`;
            item.style.borderRadius = '4px';

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <strong>${mission.title}</strong>
                    <span style="color: ${mission.achieved ? '#00ff80' : '#aaa'}; font-weight: bold;">
                        ${mission.achieved ? '✓ 達成済み' : '未達成'}
                    </span>
                </div>
                <p style="font-size: 13px; color: #ccc; margin-top: 4px;">${mission.description}</p>
                <div style="font-size: 11px; color: #ff007f; margin-top: 2px;">報酬: ${mission.reward}</div>
            `;
            container.appendChild(item);
        });
    },

    // 特定のミッションIDを達成状態にする
    triggerCheck(missionId) {
        const mission = Game.userMissions.find(m => m.id === missionId);
        if (mission && !mission.achieved) {
            mission.achieved = true;
            // 状態をローカルに一時保存したい場合はGameデータをそのまま更新
            console.log(`ミッション達成！: ${mission.title}`);
            this.renderMissions();
        }
    }
};
