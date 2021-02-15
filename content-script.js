;(() => {
	let hidelist = false
	let privateList = []
	let sliderPosition = 0
	let pageWidth
	let screenSizeCategory // 'medium' | 'large'
	let sliderElementWidth // 1/6 | 1/4
	let isLoading
	let myAccount
	let mouseCoord

	const getPageWidth = () =>
		window.innerWidth ||
		document.documentElement.clientWidth ||
		document.body.clientWidth

	const setContextMenu = () => {
		document.addEventListener(
			'mousedown',
			(event) => {
				if (event.button === 2)
					chrome.runtime.sendMessage({ message: 'createContextMenu' })
			},
			true,
		)
	}

	const listenContextMenu = () => {
		document.addEventListener(
			'contextmenu',
			(event) => {
				clickedEl = event.target
			},
			true,
		)
	}

	const listenWindowResizeEvent = () => (window.onresize = windowResize)

	const windowResize = () => {
		const newPageWidth = getPageWidth()
		if (newPageWidth !== pageWidth) {
			pageWidth = newPageWidth
			processPageWidth()
		}
	}

	const processPageWidth = () => {
		if (pageWidth > 1400) {
			screenSizeCategory = 'large'
			sliderElementWidth = 1 / 6
		} else if (pageWidth > 800 && pageWidth < 1099) {
			screenSizeCategory = 'medium'
			sliderElementWidth = 1 / 4
		}
	}

	const getAccount = () => {
		const secondaryAccountDiv = document.getElementsByClassName(
			'header-profile-name',
		)[0]
		if (secondaryAccountDiv) {
			return secondaryAccountDiv.textContent.trim()
		} else {
			const accountDiv = document.querySelectorAll(
				'.account-dropdown-button a',
			)[0]
			if (accountDiv) {
				const accountName = accountDiv
					.getAttribute('aria-label')
					.split('–')[0]
					.trim()
				if (accountName) return accountName
			}
			return
		}
	}

	const updatePrivateList = () => {
		if (isLoading) {
			alert('Loading your private list, hang in there :)')
		} else {
			const clickedElemAttribute = clickedEl.getAttribute('data-id')
			let title
			if (clickedElemAttribute) title = clickedEl.getAttribute('alt')
			else {
				const closeElements = document.elementsFromPoint(
					mouseCoord.x,
					mouseCoord.y,
				)
				const imageElement = closeElements.filter(
					(elem) => elem.className === 'previewModal--boxart',
				)[0]
				title = imageElement.getAttribute('alt')
			}
			const titleLink = document.querySelectorAll(
				`[aria-label="${title}"]`,
			)[0]
			const watchLink = titleLink.getAttribute('href')
			const img = titleLink
				.getElementsByClassName('boxart-image')[0]
				.getAttribute('src')
			const titleId =
				watchLink.indexOf('?') > -1
					? watchLink.substring(
							watchLink.lastIndexOf('/') + 1,
							watchLink.lastIndexOf('?'),
					  )
					: watchLink.substring(
							watchLink.lastIndexOf('/') + 1,
							watchLink.length,
					  )
			if (titleId) {
				if (elementIsInList(titleId)) removeItemFromList(titleId)
				else
					addElementInList({
						title,
						img,
						id: titleId,
					})
			} else {
				alert(
					"Couldn't find the element to add/remove to your private list, sorry...",
				)
			}
		}
	}

	const elementIsInList = (id) => privateList.some((elem) => elem.id === id)

	const removeItemFromList = (id) => {
		if (id) {
			let confirmRemoval = confirm(
				'The item is present in your private list. Do you want to remove it?',
			)
			if (confirmRemoval) {
				privateList.splice(
					privateList.findIndex((elem) => elem.id === id),
				)
				chrome.storage.local.set({ [myAccount]: privateList })
				render()
			}
		}
	}

	const addElementInList = (element) => {
		privateList = [...privateList, element]
		chrome.storage.local.set({ [myAccount]: privateList })
		render()
	}

	const checkHidingSetting = (event = false) => {
		return new Promise((resolve, reject) => {
			return chrome.storage.local.get(
				['hideNetflixPrivateList'],
				(data) => {
					if (typeof data.hideNetflixPrivateList !== 'undefined')
						hidelist = data.hideNetflixPrivateList
					if (event) render()
					return resolve()
				},
			)
		})
	}

	const getStoredList = () => {
		return new Promise((resolve, reject) => {
			return chrome.storage.local.get(myAccount, (data) => {
				if (typeof data[myAccount] === 'undefined')
					chrome.storage.local.set({ myAccount: privateList })
				else privateList = data[myAccount]
				return resolve()
			})
		})
	}

	const listenMessages = () => {
		chrome.extension.onMessage.addListener((message) => {
			if (message == 'updatePrivateList') updatePrivateList()
			else if (message == 'hideList') checkHidingSetting(true)
		})
	}

	const render = () => {
		const publicList = document.querySelectorAll(
			"[data-list-context='queue']",
		)[0]
		let privateListDiv = document.querySelectorAll('#private_list_carousel')
		// re-render full list from scratch each time (for now)
		if (privateListDiv.length) privateListDiv[0].remove()
		if (publicList) {
			const newNode = document.createElement('div')
			newNode.setAttribute('id', 'private_list_carousel')
			newNode.className = 'lolomoRow lolomoRow_title_card'
			newNode.innerHTML = generateListHTML()
			publicList.after(newNode)
			const beforeHandle = document.getElementsByClassName(
				'beforeHandle',
			)[0]
			const afterHandle = document.getElementsByClassName(
				'afterHandle',
			)[0]
			if (beforeHandle)
				beforeHandle.addEventListener('click', beforeHandleClick, false)
			if (afterHandle)
				afterHandle.addEventListener('click', afterHandleClick, false)
		}
		if (document.getElementById('private_list_carousel'))
			document.getElementById(
				'private_list_carousel',
			).style.display = hidelist ? 'none' : 'block'
	}

	const generateListHTML = () => {
		let newNodeHTML = `
      <h2 class="rowHeader"><a aria-label="my private list" class="rowTitle"><div class="row-header-title">My Private List</div></a></h2>
      <div class="rowContainer rowContainer_title_card" id="row-1">
      <div class="ptrack-container">
      <div class="rowContent slider-hover-trigger-layer">
      <div class="slider">
      <span class="handle handlePrev active beforeHandle" tabindex="0" role="button" aria-label="See previous titles"><b class="indicator-icon icon-leftCaret"></b></span>
      <div class="sliderMask showPeek">
      <div class="sliderContent row-with-x-columns privateSlider">`
		privateList.forEach((element, index) => {
			newNodeHTML += `
          <div class="private-slider-item slider-item slider-item-${index}" style="">
          <div class="title-card-container">
          <div id="title-card-1-${index}" class="slider-refocus title-card">
          <div class="ptrack-content">
          <a href="https://www.netflix.com/watch/${element.id}" role="link" aria-label="${element.title}" tabindex="0" aria-hidden="false" class="slider-refocus">
          <div class="boxart-size-16x9 boxart-container">
          <img class="boxart-image boxart-image-in-padded-container" src="${element.img}" alt="${element.title}" title="${element.title}" data-id="${element.id}">
          <div class="fallback-text-container" aria-hidden="true"><p class="fallback-text">${element.title}</p></div>
          </div></a>
          <div class='bob-container'><span></span></div>
          </div></div></div></div>
         `
			if (index === privateList.length - 1) {
				newNodeHTML += `
            </div>
            <span class="handle handleNext active afterHandle" tabindex="0" role="button" aria-label="See more titles">
            <b class="indicator-icon icon-rightCaret"></b>
            </span>
            </div></div></div></div></div>`
			}
		})
		if (!privateList.length) {
			newNodeHTML += `
          </div>
          <span class="handle handleNext active afterHandle" tabindex="0" role="button" aria-label="See more titles">
          <b class="indicator-icon icon-rightCaret"></b>
          </span>
          </div></div></div></div></div>`
		}
		return newNodeHTML
	}

	const beforeHandleClick = () => {
		if (sliderPosition > 0) {
			sliderPosition -= 1
			const newSliderPosition = getNewSliderPositioning(sliderPosition)
			setSliderNewPositioning(newSliderPosition)
		} else {
			const maxSliderPosition = getMaxSliderPosition()
			sliderPosition = maxSliderPosition
			const newSliderPosition = getNewSliderPositioning(sliderPosition)
			setSliderNewPositioning(newSliderPosition)
		}
	}

	const afterHandleClick = () => {
		const maxSliderPosition = getMaxSliderPosition()
		if (sliderPosition >= maxSliderPosition) sliderPosition = 0
		else sliderPosition += 1
		const newSliderPosition = getNewSliderPositioning(sliderPosition)
		setSliderNewPositioning(newSliderPosition)
	}

	const getMaxSliderPosition = () =>
		Math.ceil(privateList.length * sliderElementWidth) - 1

	const getNewSliderPositioning = (sliderPosition) =>
		(-sliderPosition * 100).toString() + '%'

	const getSliderDiv = () =>
		document.getElementsByClassName('privateSlider')[0]

	const setSliderNewPositioning = (newPosition) => {
		const sliderDiv = getSliderDiv()
		if (!sliderDiv.classList.contains('animating'))
			sliderDiv.classList.add('animating')
		sliderDiv.style.webkitTransform = `translate3d(${newPosition}, 0px, 0px)`
		sliderDiv.style.transform = `translate3d(${newPosition}, 0px, 0px)`
		setTimeout(() => {
			sliderDiv.classList.remove('animating')
		}, 1000)
	}

	isLoading = true
	pageWidth = getPageWidth()
	processPageWidth()
	listenWindowResizeEvent()
	setContextMenu()
	listenContextMenu()
	listenMessages()
	checkHidingSetting().then(() => {
		myAccount = getAccount()
		getStoredList().then(() => {
			isLoading = false
			render()
			const handleMousemove = (event) => {
				mouseCoord = { x: event.x, y: event.y }
			}
			document.addEventListener('mousemove', handleMousemove)
		})
	})
})()
