# After Effects animation parser

### Usefull links
* [After Effects scripting guide](http://docs.aenhancers.com/)
* [common info for Adobe js](http://estk.aenhancers.com/1%20-%20Introduction/index.html)
* [Photoshop js docs](http://cssdk.s3-website-us-east-1.amazonaws.com/sdk/1.0/docs/WebHelp/references/csawlib/com/adobe/photoshop/package-detail.html)
* [Oficial Adobe scripting guide](http://download.macromedia.com/pub/developer/aftereffects/scripting/After-Effects-CS6-Scripting-Guide.pdf)

### Tree of layer's params
	Маркер (1)
	Перераспределение времени (2)
	Средства отслеживания движения (3)
	Маски (4)
	Эффекты (5)
		Размытие по Гауссу
	Преобразовать (6)
		Опорная точка
		Положение
		X Положение
		Y Положение
		Z Положение
		Масштаб
		Ориентация
		Поворот X
		Поворот Y
		Поворот
		Непрозрачность
		Отображается в отражениях
	Стили слоя (7)
		Параметры наложения
		Тень
		Внутренняя тень
		Внешнее свечение
		Внутреннее свечение
		Скос и тиснение
		Глянец
		Наложение цвета
		Наложение градиента
		Наложение узора
		Обводка
	Геометрические параметры (8)
		Кривизна
		Сегменты
	Геометрические параметры (9)
		Тип фаски
		Направление фаски
		Глубина фаски
		Глубина фаски отверстия
		Глубина экструзии
	Параметры материала (10)
		Отбрасывает тени
		Передача света
		Принимает тени
		Принимает свет
		Отображается в отражениях
		Освещение
		Диффузия
		Интенсивность зеркального отражения
		Зеркальный блеск
		Металл
		Интенсивность отражения
		Резкость отражения
		Уменьшение отражения
		Прозрачность
		Уменьшение прозрачности
		Индекс преломления
	Аудио (11)
		Уровни аудио
	Данные (12)
	Основные свойства (13)

	Ussues:
	* не работает serial если для параметра задан только один keyframe
