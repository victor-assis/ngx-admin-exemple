# Web Usage Analysis Report

## Overall Summary
- **Framework Detected**: angular
- **Adoption Score**:
    - **nb**: 87%
    - **Internal**: 9%
    - **External**: 4%

---

## Design System: `nb`

### Component Usage (`<tag>`)
- `nb-card`: **154**
- `nb-option`: **152**
- `nb-card-body`: **133**
- `nb-card-header`: **125**
- `nb-icon`: **41**
- `nb-select`: **41**
- `nb-alert`: **21**
- `nb-action`: **18**
- `nb-tab`: **17**
- `nb-radio`: **15**
- `nb-progress-bar`: **14**
- `nb-checkbox`: **12**
- `nb-step`: **12**
- `nb-list-item`: **11**
- `nb-card-footer`: **10**
- `nb-list`: **9**
- `nb-search`: **8**
- `nb-tabset`: **8**
- `nb-layout-column`: **6**
- `nb-accordion-item`: **6**
- `nb-accordion-item-header`: **6**
- `nb-accordion-item-body`: **6**
- `nb-option-group`: **6**
- `nb-user`: **5**
- `nb-radio-group`: **5**
- `nb-actions`: **4**
- `nb-layout`: **3**
- `nb-layout-header`: **3**
- `nb-sidebar`: **3**
- `nb-layout-footer`: **3**
- `nb-card-front`: **3**
- `nb-card-back`: **3**
- `nb-stepper`: **3**
- `nb-flip-card`: **2**
- `nb-calendar`: **2**
- `nb-datepicker`: **2**
- `nb-accordion`: **2**
- `nb-menu`: **1**
- `nb-reveal-card`: **1**
- `nb-calendar-month-picker`: **1**
- `nb-calendar-range`: **1**
- `nb-chat`: **1**
- `nb-chat-message`: **1**
- `nb-chat-form`: **1**
- `nb-rangepicker`: **1**
- `nb-route-tabset`: **1**
- `nb-tree-grid-row-toggle`: **1**
- `nb-calendar-day-picker`: **1**
- `nb-select-label`: **1**

### Directive Usage
- `nbbutton`: **118**
- `nbinput`: **41**
- `nbpopover`: **29**
- `nbpopovertrigger`: **22**
- `nbspinner`: **18**
- `nbspinnerstatus`: **18**
- `nbsteppernext`: **13**
- `nbtooltip`: **12**
- `nbspinnersize`: **12**
- `nbtooltipplacement`: **10**
- `nbstepperprevious`: **8**
- `nbtooltipstatus`: **6**
- `nbspinnermessage`: **6**
- `nbpopoverplacement`: **4**
- `nbdatepicker`: **3**
- `nbinfinitelist`: **2**
- `nbtooltipicon`: **2**
- `nbisgranted`: **1**
- `nbcontextmenu`: **1**

### Class Usage
- `nb-snowy-circled`: **2**
- `nb-sunny-circled`: **2**
- `nb-flame-circled`: **2**
- `nb-loop-circled`: **2**
- `nb-square`: **1**

### CSS Custom Property Usage
- `--nb-color-basic-100`: **1**

### SCSS Variable Usage
- `$nb-color-basic-100`: **1**
- `$nb-themes`: **1**

### 🧬 Props usadas por componente

**nb-menu**
- `items`: `menu`

**nb-icon**
- `icon`: `menu-2-outline`, `chevron-right-outline`, `chevron-up-outline`, `chevron-down-outline`, `showVisitorsStatistics ? 'arrow-forward-outline' : 'arrow-back-outline'`, `item.deltaUp ? 'arrow-up' : 'arrow-down'`, `phone-outline`, `month.down ? 'arrow-down' : 'arrow-up'`, `globe`, `github`, `arrow-ios-downward`, `grid`, `pause-circle-outline`, `list-outline`, `search-outline`, `settings-2-outline`, `sun-outline`, `file-text-outline`, `icon`, `earningLiveUpdateCardData.delta.up ? 'arrow-up' : 'arrow-down'`, `item.delta.up ? 'arrow-up' : 'arrow-down'`, `shuffle-2-outline`, `skip-back-outline`, `player.paused ? 'play-circle-outline' : 'pause-circle-outline'`, `skip-forward-outline`, `repeat-outline`, `volume-down-outline`, `volume-up-outline`, `power-outline`, `minus`, `plus`
- `pack`: `eva`, `fa`, `far`, `ion`
- `class`: `flip-icon`, `toggle-icon`, `show-hide-toggle`, `collapse`, `today-icon`, `action-icon`, `direction`, `skip`, `play`, `volume-icon`, `power-icon`
- `click`: `toggleView()`, `toggleStatistics()`, `collapse()`
- `class.down`: `month.down`
- `class.up`: `!month.down`
- `hidden`: `isCollapsed()`
- `ngfor`: `let icon of evaIcons`, `let icon of icons.fontAwesome`, `let icon of icons.fontAwesomeRegular`, `let icon of icons.ionicons`

**nb-select**
- `selected`: `currentTheme`, `type`, `1`, `position`, `status`, `selectedCurrency`, `commonSelectedItem`, `selectedItem`
- `selectedchange`: `changeTheme($event)`, `getUserActivity($event); type = $event`, `changePeriod($event)`, `changeCurrency($event)`
- `status`: `primary`, `info`, `danger`, `success`, `warning`
- `class`: `type-select`, `position-select`, `period-select`
- `placeholder`: `Select Showcase`, `Multiple Select`, `Cleanable`, `Placeholder`, `Custom Label`, `Select Groups`, `Disabled`, `Disabled Items`, `Disabled Groups`, `Round`, `Rectangle`, `Semi-round`, `XSmall`, `Small`, `Medium`, `Large`, `Primary`, `Info`, `Danger`, `Success`, `Warning`
- `multiple`: ``
- `disabled`: ``
- `shape`: `round`, `rectangle`, `semi-round`
- `size`: `xsmall`, `small`, `medium`, `large`
- `outline`: ``
- `hero`: ``

**nb-option**
- `ngfor`: `let theme of themes`, `let t of types`, `let p of positions`, `let period of types`, `let currency of currencies`
- `value`: `theme.value`, `t`, `1`, `2`, `p`, `period`, `currency`, `3`, `4`, `21`, `22`, `23`, `24`, `31`, `32`, `33`, `34`
- `disabled`: ``

**nb-actions**
- `size`: `small`, `actionSize`, `medium`
- `fullwidth`: ``

**nb-action**
- `class`: `control-item`, `user-action`
- `icon`: `email-outline`, `bell-outline`, `menu-outline`, `search-outline`, `settings-2-outline`
- `nbisgranted`: `['view', 'user']`
- `disabled`: ``

**nb-search**
- `type`: `rotate-layout`, `modal-zoomin`, `modal-move`, `modal-drop`, `modal-half`, `curtain`, `column-curtain`
- `tag`: `rotate-layout`, `modal-zoomin`, `modal-move`, `modal-drop`, `modal-half`, `curtain`, `column-curtain`

**nb-user**
- `nbcontextmenu`: `userMenu`
- `onlypicture`: `userPictureOnly`
- `name`: `user?.name`, `c.user.name`, `Han Solo`, `user.name`
- `picture`: `user?.picture`, `c.user.picture`
- `title`: `c.type`, `user.title`
- `size`: `large`

**nb-layout**
- `windowmode`: ``

**nb-layout-header**
- `fixed`: ``

**nb-sidebar**
- `class`: `menu-sidebar`
- `tag`: `menu-sidebar`
- `responsive`: ``

**nb-layout-column**
- `class`: `small`

**nb-layout-footer**
- `fixed`: ``

**nb-card**
- `size`: `large`, `breakpoint.width >= breakpoints.md ? 'medium' : 'giant'`, `tiny`, `medium`, `small`, `giant`, `breakpoint.width >= breakpoints.sm ? 'giant' : ''`, `breakpoint.width >= breakpoints.xxxl ? 'medium' : 'large'`, `xsmall`
- `class`: `cards-container`, `table-card`, `chart-card`, `solar-card`, `actions-card`, `inline-form-card`, `own-scroll`, `list-card`, `col-md-12 col-lg-12 col-xxxl-12`, `headings-card`, `popover-card`, `form-input-card`
- `click`: `on = !on`
- `ngclass`: `{'off': !on}`
- `nbspinner`: `true`
- `nbspinnerstatus`: `primary`, `success`, `info`, `warning`, `danger`
- `nbspinnersize`: `tiny`, `small`, `medium`, `large`, `giant`

**nb-card-header**
- `status`: `warning`
- `class`: `header`

**nb-card-body**
- `class`: `checkbox-radio`, `debounce-card`, `result-from-dialog`, `body`, `select-group`

**nb-tabset**
- `fullwidth`: ``
- `changetab`: `changeTab($event)`, `toggleLoadingAnimation()`

**nb-tab**
- `tabtitle`: `Orders`, `Profit`, `Contacts`, `Recent`, `year.title`, `Temperature`, `Humidity`, `Simple Tab #1`, `Simple Tab #2`, `Simple Tab #3`, `Full width tab #1`, `Full width tab #2`, `Full width tab #3`, `What's up?`, `Second Tab`, `Tab 1`, `Tab 2`
- `lazyload`: `true`
- `ngfor`: `let year of listData`
- `active`: `year.active`
- `nbspinner`: `loading`
- `nbspinnerstatus`: `success`, `info`
- `nbspinnersize`: `giant`

**nb-flip-card**
- `showtogglebutton`: `false`
- `flipped`: `flipped`

**nb-card-front**

**nb-card-back**

**nb-progress-bar**
- `value`: `item.activeProgress`, `20`, `40`, `60`, `80`, `100`, `value`
- `status`: `primary`, `info`, `success`, `warning`, `danger`, `status`
- `size`: `tiny`, `small`, `medium`, `large`, `giant`
- `displayvalue`: `true`

**nb-reveal-card**
- `showtogglebutton`: `false`
- `revealed`: `revealed`

**nb-list**
- `class`: `user-activity-list`
- `nbinfinitelist`: ``
- `threshold`: `500`
- `bottomthreshold`: `loadNext(firstCard)`, `loadNext(secondCard)`
- `listenwindowscroll`: ``

**nb-list-item**
- `ngfor`: `let item of userActivity`, `let c of contacts`, `let c of recent`, `let month of year.months`, `let newsPost of firstCard.news`, `let _ of firstCard.placeholders`, `let newsPost of secondCard.news`, `let _ of secondCard.placeholders`, `let fruit of fruits`, `let user of users`, `let item of frontCardData; trackBy: trackByDate`
- `class`: `contact`, `item`

**nb-card-footer**
- `class`: `footer`

**nb-radio-group**
- `ngmodel`: `temperatureMode`, `humidityMode`
- `name`: `temperature-mode`, `humidity-mode`
- `value`: `radioGroupValue`
- `disabled`: ``

**nb-radio**
- `value`: `cool`, `warm`, `heat`, `fan`, `'This is value 1'`, `'This is value 2'`, `'This is value 3'`, `'Disabled Value'`
- `disabled`: ``

**nb-alert**
- `status`: `primary`, `success`, `info`, `warning`, `danger`
- `outline`: `primary`, `success`, `info`, `warning`, `danger`
- `accent`: `info`, `danger`, `warning`, `primary`

**nb-calendar-month-picker**
- `month`: `month`
- `cellcomponent`: `monthCellComponent`

**nb-calendar**
- `date`: `date`, `date2`
- `boundingmonth`: `true`
- `showweeknumber`: ``
- `daycellcomponent`: `dayCellComponent`

**nb-calendar-range**
- `range`: `range`

**nb-chat**
- `title`: `Nebular Conversational UI`
- `size`: `large`
- `status`: `primary`

**nb-chat-message**
- `ngfor`: `let msg of messages`
- `type`: `msg.type`
- `message`: `msg.text`
- `reply`: `msg.reply`
- `sender`: `msg.user.name`
- `date`: `msg.date`
- `files`: `msg.files`
- `quote`: `msg.quote`
- `latitude`: `msg.latitude`
- `longitude`: `msg.longitude`
- `avatar`: `msg.user.avatar`

**nb-chat-form**
- `send`: `sendMessage($event)`
- `dropfiles`: `true`

**nb-datepicker**
- `#formpicker`: ``
- `#picker`: ``
- `min`: `min`
- `max`: `max`

**nb-rangepicker**
- `#rangepicker`: ``

**nb-checkbox**
- `status`: `success`, `warning`, `danger`
- `checked`: ``
- `disabled`: ``
- `ngmodel`: `destroyByClick`, `preventDuplicates`, `hasIcon`

**nb-accordion**
- `multi`: ``

**nb-accordion-item**
- `#item`: ``

**nb-accordion-item-header**

**nb-accordion-item-body**

**nb-stepper**
- `orientation`: `horizontal`, `vertical`
- `#stepper`: ``

**nb-step**
- `label`: `labelOne`, `labelTwo`, `Third step`, `labelFour`, `First step`, `Second step`, `Fourth step`
- `stepcontrol`: `firstForm`, `secondForm`, `thirdForm`
- `hidden`: `true`

**nb-route-tabset**
- `tabs`: `tabs`

**nb-tree-grid-row-toggle**
- `expanded`: `expanded`
- `ngif`: `isDir(); else fileIcon`

**nb-calendar-day-picker**
- `boundingmonths`: `false`
- `visibledate`: `date`
- `date`: `selectedValue`
- `datechange`: `select.emit($event)`

**nb-select-label**

**nb-option-group**
- `title`: `Group 1`, `Group 2`, `Group 3`
- `disabled`: ``


---

## Design System: `score`


---

## Application-Specific Components

### Internal Application Components
- `ngx-header`: **3**
- `ngx-footer`: **3**
- `ngx-legend-chart`: **3**
- `ngx-chart-panel-summary`: **2**
- `ngx-chart-panel-header`: **2**
- `ngx-traffic-cards-header`: **2**
- `ngx-temperature-dragger`: **2**
- `ngx-news-post`: **2**
- `ngx-news-post-placeholder`: **2**
- `ngx-one-column-layout`: **1**
- `ngx-profit-card`: **1**
- `ngx-earning-card`: **1**
- `ngx-traffic-reveal-card`: **1**
- `ngx-ecommerce-charts`: **1**
- `ngx-country-orders`: **1**
- `ngx-progress-section`: **1**
- `ngx-ecommerce-visitors-analytics`: **1**
- `ngx-user-activity`: **1**
- `ngx-status-card`: **1**
- `ngx-temperature`: **1**
- `ngx-electricity`: **1**
- `ngx-rooms`: **1**
- `ngx-contacts`: **1**
- `ngx-solar`: **1**
- `ngx-kitten`: **1**
- `ngx-traffic`: **1**
- `ngx-weather`: **1**
- `ngx-security-cameras`: **1**
- `ngx-chartjs-pie`: **1**
- `ngx-chartjs-bar`: **1**
- `ngx-chartjs-line`: **1**
- `ngx-chartjs-multiple-xaxis`: **1**
- `ngx-chartjs-bar-horizontal`: **1**
- `ngx-chartjs-radar`: **1**
- `ngx-d3-pie`: **1**
- `ngx-d3-bar`: **1**
- `ngx-d3-line`: **1**
- `ngx-d3-advanced-pie`: **1**
- `ngx-d3-area-stack`: **1**
- `ngx-echarts-pie`: **1**
- `ngx-echarts-bar`: **1**
- `ngx-echarts-line`: **1**
- `ngx-echarts-multiple-xaxis`: **1**
- `ngx-echarts-area-stack`: **1**
- `ngx-echarts-bar-animation`: **1**
- `ngx-echarts-radar`: **1**
- `ngx-orders-chart`: **1**
- `ngx-profit-chart`: **1**
- `ngx-country-orders-map`: **1**
- `ngx-country-orders-chart`: **1**
- `ngx-earning-card-front`: **1**
- `ngx-earning-card-back`: **1**
- `ngx-stats-card-front`: **1**
- `ngx-stats-card-back`: **1**
- `ngx-traffic-front-card`: **1**
- `ngx-traffic-back-card`: **1**
- `ngx-visitors-analytics-chart`: **1**
- `ngx-slide-out`: **1**
- `ngx-visitors-statistics`: **1**
- `ngx-electricity-chart`: **1**
- `ngx-room-selector`: **1**
- `ngx-player`: **1**
- `ngx-tiny-mce`: **1**
- `ngx-traffic-chart`: **1**
- `ngx-nebular-select`: **1**
- `ngx-interactive-progress-bar`: **1**
- `ngx-spinner-sizes`: **1**
- `ngx-spinner-color`: **1**
- `ngx-spinner-in-buttons`: **1**
- `ngx-spinner-in-tabs`: **1**
- `ngx-search`: **1**
- `ngx-map`: **1**
- `ngx-earning-pie-chart`: **1**
- `ngx-stats-ares-chart`: **1**
- `ngx-traffic-bar-chart`: **1**
- `ngx-earning-live-update-chart`: **1**
- `ngx-stats-bar-animation-chart`: **1**
- `ngx-traffic-bar`: **1**
- `ngx-app`: **1**

### Unrecognized Custom Components (Outside Components)
- `router-outlet`: **12**
- `ng-template`: **10**
- `ng-content`: **9**
- `google-map`: **2**
- `map-marker`: **2**
- `ngx-charts-advanced-pie-chart`: **1**
- `ngx-charts-area-chart`: **1**
- `ngx-charts-bar-vertical`: **1**
- `ngx-charts-line-chart`: **1**
- `ngx-charts-pie-chart`: **1**
- `ngx-charts-polar-chart`: **1**
- `ng2-smart-table`: **1**


---

