// Проверка на допустимость ввода в поле логин

// Получение символа нажатой клавиши 
function getChar(event) {
	return String.fromCharCode(event.keyCode || event.charCode);
}

// Форма регистрации
var regBlock = document.querySelector('.reg');

// Блок блокиратор
var blockerBlock = document.querySelector('.blocker');

// Поле ФИО
var regName = document.getElementById('regName');

// Поле логин
var regLogin = document.getElementById('regLogin');

// Поле с ошибкой
var regError = document.querySelector('.reg__error');

// Текущий токен зарегистрированного пользователя
var userToken = "";

// Имя текущего пользователя
var userName = "";

// Логин текущего пользователя
var userLogin = "";

// Поле с именем текущего пользователя
var userTitle = document.querySelector('.left__profile-user');

// Шаблон общего списка пользователей
var usersList = document.getElementById('usersList').innerHTML;

// Скомпилированный шаблон списка пользователя
var usersListCompile = Handlebars.compile(usersList);

// Шаблон сообщения чата
var messageChat = document.getElementById('messageChat').innerHTML;

// Скомпилированный шаблон сообщения
var messageChatCompile = Handlebars.compile(messageChat);

// Список сообщений чата
var messagesList = document.querySelector('.right__list');

// Блок-обертка для списка пользователей
var usersContent = document.querySelector('.left__content');

// Подключение handlebars helper
Handlebars.registerHelper('formatDate', function(ts) {
	return new Date(ts).toLocaleString();
});

if(regLogin) {

	regLogin.addEventListener('keypress',function(event){
		var e = event||window.event;
		
		// спец. сочетания - не обрабатываем
		if (e.ctrlKey || e.altKey || e.metaKey) {
			return true
		};

		var reg = new RegExp('^[A-Za-z0-9-_]', 'g');
		var char = getChar(e);
	
		if(!char.match(reg)){
			event.preventDefault();
		}
		
	});

	regLogin.addEventListener('paste',function(e){
		
		// Получаем данные из буфера обмены
		data = e.clipboardData.getData('text');
		var reg = new RegExp('^[A-Za-z0-9-_]', 'g');
		
		if(!data.match(reg)){
			event.preventDefault();
		}

	});
}


// Кнопка отправить сообщение
var sendButton = document.getElementById('sendMessage');

// Поле с текстом сообщения
var messageInput = document.getElementById('messageInput');

// Регистрация в чате
var regButton = document.querySelector('.reg__submit');

regButton.addEventListener('click',function(e){
	e.preventDefault();

	// Проверяем чтобы были заполнены поля ФИО и логин
	if(!regName.value.trim()) {
		regError.innerHTML = "Не заполнено поле ФИО";
		regError.style.display = "block";
		return;
	}

	if(!regLogin.value.trim()) {
		regError.innerHTML = "Не заполнен логин";
		regError.style.display = "block";
		return;
	}

	// Если ошибок нет, скрываем блок с ошибкой
	regError.innerHTML = "";
	regError.style.display = "none";

	// Создаем соединение с сервером
	var connection = new WebSocket('ws://localhost:5000');
	
	// Обработка ошибки соединения с сервером
	connection.onerror = function(e) {
		alert("Ошибка соединения с сервером");
	};

	// Событие передача сообщения на сервер
	sendMessage.addEventListener('click',function(e){
		e.preventDefault();

		// Проверка на пустое сообщение

		if(!messageInput.value.trim()) {
			return;
		}

		// Объект с информацией об сообщении
		var newMessage = {"op":"message",
										  "token":userToken,
										  "data": {
												"body": messageInput.value
										  }};

		// Формируем JSON для отправки на сервер
		var newMessageJson = JSON.stringify(newMessage);
		connection.send(newMessageJson);

		// Очищаем поле после отправки сообщения
		messageInput.value = "";
	
	});

	// Отправляем запрос на регистрацию
	connection.onopen = function(e) {
		// Формируем объект
		var newUser = {"op":"reg", 
									 "data": {
											"name": regName.value,
											"login": regLogin.value
									 }};

		// Формируем JSON для отправки на сервер
		var newUserJson = JSON.stringify(newUser);

		connection.send(newUserJson);

	}

	// Прослушка сообщения сервера
	connection.onmessage = function(e) {

		// Получаем ответ сервера
		var answerJson = e.data;

		// Если вернулся пустой ответ, ничего не делаем
		if (!answerJson) {
			return;
		}

		// Преобразуем ответ в объект
		var answerObj = JSON.parse(answerJson);

		// Устанавливаем тип ответа
		var answerType = answerObj['op'];

		// В зависимости от типа ответа проводим действия
		if (answerType == "error") {
			// Если такой пользователь уже есть

			// Сообщаем об ошибке в форму регистрации
			regError.innerHTML = "Пользователь с таким именем уже существует";
			regError.style.display = "block";
			
			// Закрываем соедиение
			connection.close();
		} else if (answerType == "token") {
			// Если регистрация прошла успешно

			// Скрываем форму
			regBlock.style.display = "none";

			// И блок блокиратор
			blockerBlock.style.display = "none";

			// Записываем токен текущего пользователя
			userToken = answerObj['token'];

			// Записываем имя текущего пользователя
			userName = regName.value;

			// Записываем логин текущего пользователя
			userLogin = regLogin.value;

			// Выводим в заголовок страницы имя текущего пользователя
			userTitle.innerHTML = "Добро пожаловать, "+userName+"!";

			// Список пользователей онлайн в чате
			var usersOnline = answerObj['users'];

			// Выводим список пользователей в чате
			var templateUsersList = usersListCompile({list: usersOnline});
			usersContent.innerHTML = templateUsersList;

		} else if (answerType == "user-enter") {
			// Если новый пользователь вошел в чат

			// Получаем элемент список пользователей
			var leftList = document.querySelector('.left__list');

			// Добавляем нового пользователя в список
			var userEnter = document.createElement('li');
			userEnter.classList.add('left__item');
			userEnter.innerHTML = answerObj['user']['name'];
			userEnter.setAttribute("id", answerObj['user']['login']);		
			leftList.appendChild(userEnter);

		} else if (answerType == "user-out") {
			// Если пользователь покинул чат

			// Удаляем элемент пользователя из списка пользователя
			var userOut = document.getElementById(answerObj['user']['login']);
			userOut.remove();
		} else if (answerType == "message") {
			// Новое сообщение в чате

			// Компилируем шаблон
			var templateMessageChat = messageChatCompile({message: answerObj});

			// Создаем новый элемент списка
			var newMessage = document.createElement('li');
			newMessage.classList.add('right__item','clearfix');
			newMessage.innerHTML = templateMessageChat;

			// Выводим сообщение
			messagesList.appendChild(newMessage);

		}
		
	}

});

