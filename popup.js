const checkbox = document.querySelector('input[name=hideList]')

chrome.storage.local.get(['hideNetflixPrivateList'], (data) => {
	if (typeof data === 'undefined')
		chrome.storage.local.set({ hideNetflixPrivateList: false })
	else checkbox.checked = data.hideNetflixPrivateList
})

checkbox.addEventListener('change', () => {
	chrome.storage.local.set({ hideNetflixPrivateList: checkbox.checked })
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, 'hideList')
	})
})
