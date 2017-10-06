/**
 * Builds a template to render rooms later
 * 
 * @param  {Boolean} free
 * @param  {String}  room
 * @param  {String}  building
 * @param  {String}  floor
 * @param  {String}  room_nr
 * @param  {String}  summary
 * @param  {String}  display_text
 * @param  {String}  room_id
 * 
 * @return {String|HTML}
 */
function create_room_html(
    free,
    room, 
    building, 
    floor, 
    room_nr, 
    summary, 
    display_text,
    room_id
) {
    if (free) {
        external_link = '';
    } 
    else {
        external_link = 
        `<a 
            target="_blank"
            title="Open Week Schedule"
            href="http://stundenplanung.eah-jena.de/raeume/?id=${room_id}&type=table&week=14&template=raum"
            class="mdc-button mdc-card__action material-icons">
            open_in_new
        </a>`;
    }
    
    let display_text_lowercase = display_text.charAt(0).toLowerCase() + display_text.slice(1);
    let template =
`<div class="mdc-card ${free ? '' : 'mdc-card--room-occupied'}">
    <section class="mdc-card__primary">
        <h1 class="mdc-card__title mdc-card__title--large">${room}</h1>
        ${free ? '' : `<h2 class="mdc-card__subtitle">${summary}</h2>`}
        <span class="mdc-card__available-time">
            <i class="material-icons">
                ${free ? 'done' : 'error_outline'}
            </i>
            ${display_text}
        </span>
    </section>
    <section class="mdc-card__supporting-text">
        <span>Building: ${building}</span>
        <span>Floor: ${floor}</span>
        <span>Room: ${room_nr}</span>
    </section>
    <section class="mdc-card__actions">
        ${external_link}
        
        <button 
            title="Add to Calendar"
            class="mdc-button mdc-card__action material-icons">
            date_range
        </button>
        
        <button 
            title="Copy Lecture"
            data-clipboard-text="${room}: ${display_text_lowercase}"
            class="mdc-button mdc-card__action material-icons tsp-btn-copy">
            content_copy
        </button>
    </section>
</div>`;
return template;
}
