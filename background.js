const generateId = () => Math.random().toString(16).slice(2)

const clickHandler = () => {
	chrome.tabs.query(
		{
			active: true,
			currentWindow: true,
		},
		(tabs) => {
			chrome.tabs.sendMessage(tabs[0].id, 'updatePrivateList')
		},
	)
}

const addContextMenu = () => {
	chrome.contextMenus.removeAll(() => {
		const menuId = generateId()
		chrome.contextMenus.create({
			id: 'updateNetflixPrivateList' + menuId,
			title: 'Update to my private list',
			contexts: ['page', 'selection', 'image', 'link'],
		})

		chrome.contextMenus.onClicked.addListener((info) => {
			if (info.menuItemId === 'updateNetflixPrivateList' + menuId)
				clickHandler()
		})
	})
}

chrome.runtime.onInstalled.addListener(() => {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
		chrome.declarativeContent.onPageChanged.addRules([
			{
				conditions: [
					new chrome.declarativeContent.PageStateMatcher({
						pageUrl: { hostEquals: 'www.netflix.com' },
					}),
				],
				actions: [new chrome.declarativeContent.ShowPageAction()],
			},
		])
	})
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === 'createContextMenu') addContextMenu()
})
