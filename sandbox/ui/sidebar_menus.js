import { t } from '../core/i18n.js';
import { TemplateIcons } from './templates/icons.js';

function createMenuItem({ className = '', icon, label, onClick }) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = ['history-menu-item', className].filter(Boolean).join(' ');
    item.setAttribute('role', 'menuitem');

    const iconTemplate = document.createElement('template');
    iconTemplate.innerHTML = icon;
    item.appendChild(iconTemplate.content.cloneNode(true));

    const labelText = document.createElement('span');
    labelText.textContent = label;
    item.appendChild(labelText);

    item.onclick = (clickEvent) => {
        clickEvent.stopPropagation();
        onClick();
    };
    return item;
}

export function createGroupItemMenu(controller, group) {
    const menu = document.createElement('div');
    menu.className = 'history-item-menu history-group-menu';
    menu.setAttribute('role', 'menu');
    menu.onclick = (clickEvent) => clickEvent.stopPropagation();

    const renameItem = createMenuItem({
        icon: TemplateIcons.EDIT,
        label: t('renameGroup'),
        onClick: () => controller.startGroupTitleEdit(group),
    });
    const deleteItem = createMenuItem({
        className: 'history-menu-delete',
        icon: TemplateIcons.TRASH,
        label: t('deleteGroup'),
        onClick: () => {
            if (confirm(t('deleteGroupConfirm')) && controller.itemCallbacks?.onDeleteGroup) {
                controller.itemCallbacks.onDeleteGroup(group.id);
            }
            controller.closeItemMenu();
        },
    });

    menu.appendChild(renameItem);
    menu.appendChild(deleteItem);
    return menu;
}

export function createHistoryItemMenu(controller, session) {
    const menu = document.createElement('div');
    menu.className = 'history-item-menu';
    menu.setAttribute('role', 'menu');
    menu.onclick = (clickEvent) => clickEvent.stopPropagation();

    const renameItem = createMenuItem({
        icon: TemplateIcons.EDIT,
        label: t('renameChat'),
        onClick: () => controller.startSessionTitleEdit(session),
    });
    const regenerateTitleItem = createMenuItem({
        icon: TemplateIcons.REFRESH,
        label: t('regenerateTitle'),
        onClick: () => {
            if (controller.itemCallbacks?.onRegenerateTitle) {
                controller.itemCallbacks.onRegenerateTitle(session.id);
            }
            controller.closeItemMenu();
        },
    });
    const pinItem = createMenuItem({
        icon: session.isPinned === true ? TemplateIcons.PIN_OFF : TemplateIcons.PIN,
        label: session.isPinned === true ? t('unpinChat') : t('pinChat'),
        onClick: () => {
            if (controller.itemCallbacks?.onTogglePin) {
                controller.itemCallbacks.onTogglePin(session.id);
            }
            controller.closeItemMenu();
        },
    });
    const duplicateItem = createMenuItem({
        icon: TemplateIcons.COPY,
        label: t('duplicateChat'),
        onClick: () => {
            if (controller.itemCallbacks?.onDuplicate) {
                controller.itemCallbacks.onDuplicate(session.id);
            }
            controller.closeItemMenu();
        },
    });
    const shareItem = createMenuItem({
        icon: TemplateIcons.SHARE,
        label: t('shareChat'),
        onClick: () => {
            if (controller.itemCallbacks?.onShare) {
                controller.itemCallbacks.onShare(session.id);
            }
            controller.closeItemMenu();
        },
    });
    const exportTxtItem = createMenuItem({
        icon: TemplateIcons.DOWNLOAD,
        label: t('exportChatTxt'),
        onClick: () => {
            if (controller.itemCallbacks?.onExport) {
                controller.itemCallbacks.onExport(session.id, 'txt');
            }
            controller.closeItemMenu();
        },
    });
    const exportJsonItem = createMenuItem({
        icon: TemplateIcons.DOWNLOAD,
        label: t('exportChatJson'),
        onClick: () => {
            if (controller.itemCallbacks?.onExport) {
                controller.itemCallbacks.onExport(session.id, 'json');
            }
            controller.closeItemMenu();
        },
    });
    const deleteItem = createMenuItem({
        className: 'history-menu-delete',
        icon: TemplateIcons.TRASH,
        label: t('delete'),
        onClick: () => {
            if (confirm(t('deleteChatConfirm')) && controller.itemCallbacks?.onDelete) {
                controller.itemCallbacks.onDelete(session.id);
            }
            controller.closeItemMenu();
        },
    });

    menu.appendChild(renameItem);
    menu.appendChild(regenerateTitleItem);
    menu.appendChild(pinItem);
    menu.appendChild(duplicateItem);
    menu.appendChild(shareItem);
    menu.appendChild(exportTxtItem);
    menu.appendChild(exportJsonItem);
    menu.appendChild(deleteItem);
    return menu;
}
