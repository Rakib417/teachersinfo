( function () {
	'use strict';

	const $ = ( sel, ctx = document ) => ctx.querySelector( sel );
	const $$ = ( sel, ctx = document ) => Array.from( ctx.querySelectorAll( sel ) );
	const reduceMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
	const finePointer = window.matchMedia( '(hover: hover) and (pointer: fine)' ).matches;
	const root = document.documentElement;

	/* ---------- Scroll-linked state: header, progress bar, back-to-top, timeline ---------- */
	const header = $( '.site-header' );
	const progress = $( '.scroll-progress' );
	const toTop = $( '.to-top' );
	const timeline = $( '[data-timeline]' );
	let ticking = false;

	const onScroll = () => {
		const y = window.scrollY;
		const max = root.scrollHeight - window.innerHeight;
		const p = max > 0 ? Math.min( y / max, 1 ) : 0;
		header.classList.toggle( 'is-scrolled', y > 40 );
		progress.style.setProperty( '--p', p );
		toTop.style.setProperty( '--p', p );
		toTop.classList.toggle( 'is-visible', y > 700 );

		if ( timeline ) {
			const r = timeline.getBoundingClientRect();
			const start = window.innerHeight * 0.6;
			const t = Math.min( Math.max( ( start - r.top ) / r.height, 0 ), 1 );
			timeline.style.setProperty( '--progress', t );
		}
		ticking = false;
	};
	window.addEventListener( 'scroll', () => {
		if ( ! ticking ) {
			ticking = true;
			requestAnimationFrame( onScroll );
		}
	}, { passive: true } );
	window.addEventListener( 'resize', onScroll );
	onScroll();

	/* ---------- Mobile menu ---------- */
	const toggle = $( '.menu-toggle' );
	const nav = $( '#site-nav' );
	const setMenu = ( open ) => {
		nav.classList.toggle( 'is-open', open );
		toggle.setAttribute( 'aria-expanded', String( open ) );
		toggle.setAttribute( 'aria-label', open ? 'Close menu' : 'Open menu' );
		document.body.classList.toggle( 'nav-open', open );
	};
	toggle.addEventListener( 'click', () => setMenu( ! nav.classList.contains( 'is-open' ) ) );
	nav.addEventListener( 'click', ( e ) => e.target.closest( 'a' ) && setMenu( false ) );
	document.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'Escape' && nav.classList.contains( 'is-open' ) ) {
			setMenu( false );
			toggle.focus();
		}
	} );
	window.matchMedia( '(min-width: 981px)' ).addEventListener( 'change', () => setMenu( false ) );

	/* ---------- Active section in nav ---------- */
	const navLinks = $$( '.site-nav a[data-section]' );
	const sections = navLinks.map( ( a ) => document.getElementById( a.dataset.section ) ).filter( Boolean );
	if ( sections.length && 'IntersectionObserver' in window ) {
		const spy = new IntersectionObserver( ( entries ) => {
			entries.forEach( ( entry ) => {
				if ( entry.isIntersecting ) {
					navLinks.forEach( ( a ) => a.classList.toggle( 'is-active', a.dataset.section === entry.target.id ) );
				}
			} );
		}, { rootMargin: '-45% 0px -50% 0px' } );
		sections.forEach( ( s ) => spy.observe( s ) );
	}

	/* ---------- Reveal on scroll (+ split headline) ---------- */
	const revealEls = $$( '.reveal, .split' );
	if ( reduceMotion || ! ( 'IntersectionObserver' in window ) ) {
		revealEls.forEach( ( el ) => el.classList.add( 'is-in' ) );
	} else {
		const io = new IntersectionObserver( ( entries ) => {
			entries.forEach( ( entry ) => {
				if ( ! entry.isIntersecting ) return;
				const el = entry.target;
				// Stagger siblings inside the same grid.
				const siblings = el.parentElement ? $$( ':scope > .reveal', el.parentElement ) : [];
				el.style.transitionDelay = Math.min( Math.max( siblings.indexOf( el ), 0 ), 5 ) * 90 + 'ms';
				el.classList.add( 'is-in' );
				io.unobserve( el );
				// Drop the delay afterwards so hover transitions stay snappy.
				setTimeout( () => { el.style.transitionDelay = ''; }, 1600 );
			} );
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 } );
		revealEls.forEach( ( el ) => io.observe( el ) );
	}

	/* ---------- Count-up numbers ---------- */
	const runCounter = ( el ) => {
		const raw = el.dataset.count;
		const match = raw.match( /^([^\d]*)([\d,.]+)(.*)$/ );
		if ( ! match || reduceMotion ) return;
		const [ , prefix, num, suffix ] = match;
		const target = parseFloat( num.replace( /,/g, '' ) );
		const useComma = num.includes( ',' );
		const start = performance.now();
		const duration = 1800;
		const step = ( now ) => {
			const t = Math.min( ( now - start ) / duration, 1 );
			const eased = 1 - Math.pow( 1 - t, 4 );
			const value = Math.round( target * eased );
			el.textContent = prefix + ( useComma ? value.toLocaleString( 'en-US' ) : value ) + suffix;
			if ( t < 1 ) requestAnimationFrame( step );
			else el.textContent = raw;
		};
		requestAnimationFrame( step );
	};
	const counters = $$( '[data-count]' );
	if ( counters.length && 'IntersectionObserver' in window ) {
		const co = new IntersectionObserver( ( entries ) => {
			entries.forEach( ( entry ) => {
				if ( entry.isIntersecting ) {
					runCounter( entry.target );
					co.unobserve( entry.target );
				}
			} );
		}, { threshold: 0.6 } );
		counters.forEach( ( c ) => co.observe( c ) );
	}

	/* ---------- Pointer effects (desktop only) ---------- */
	if ( finePointer && ! reduceMotion ) {
		// Spotlight: glow + border follow the cursor.
		document.addEventListener( 'pointermove', ( e ) => {
			const card = e.target.closest( '.spot' );
			if ( ! card ) return;
			const r = card.getBoundingClientRect();
			card.style.setProperty( '--mx', ( e.clientX - r.left ) + 'px' );
			card.style.setProperty( '--my', ( e.clientY - r.top ) + 'px' );
		}, { passive: true } );

		// Hero parallax: layers shift by their --d depth.
		const scene = $( '[data-parallax]' );
		const hero = $( '.hero' );
		if ( scene && hero ) {
			hero.addEventListener( 'pointermove', ( e ) => {
				const x = ( e.clientX / window.innerWidth - 0.5 ) * 2;
				const y = ( e.clientY / window.innerHeight - 0.5 ) * 2;
				scene.style.setProperty( '--px', x.toFixed( 3 ) );
				scene.style.setProperty( '--py', y.toFixed( 3 ) );
			} );
			hero.addEventListener( 'pointerleave', () => {
				scene.style.setProperty( '--px', 0 );
				scene.style.setProperty( '--py', 0 );
			} );
		}

		// Magnetic buttons.
		$$( '.magnetic' ).forEach( ( btn ) => {
			btn.addEventListener( 'pointermove', ( e ) => {
				const r = btn.getBoundingClientRect();
				const x = e.clientX - r.left - r.width / 2;
				const y = e.clientY - r.top - r.height / 2;
				btn.style.transform = `translate(${ x * 0.18 }px, ${ y * 0.3 }px)`;
			} );
			btn.addEventListener( 'pointerleave', () => { btn.style.transform = ''; } );
		} );

		// 3D tilt cards.
		$$( '.tilt' ).forEach( ( card ) => {
			card.addEventListener( 'pointermove', ( e ) => {
				const r = card.getBoundingClientRect();
				const x = ( e.clientX - r.left ) / r.width - 0.5;
				const y = ( e.clientY - r.top ) / r.height - 0.5;
				card.style.transform = `perspective(900px) rotateX(${ -y * 8 }deg) rotateY(${ x * 10 }deg) translateY(-6px)`;
			} );
			card.addEventListener( 'pointerleave', () => { card.style.transform = ''; } );
		} );
	}

	/* ---------- Publication filter + search ---------- */
	const list = $( '[data-pub-list]' );
	const chips = $$( '.chip[data-filter]' );
	let setFilter = null;
	if ( list ) {
		const search = $( '[data-pub-search]' );
		const empty = $( '.empty-state', list );
		const state = { filter: 'all', q: '' };

		const apply = () => {
			let visible = 0;
			$$( '.pub', list ).forEach( ( pub ) => {
				const cats = ( pub.dataset.cats || '' ).split( ' ' );
				const matchCat = state.filter === 'all' || cats.includes( state.filter );
				const matchQ = ! state.q || pub.textContent.toLowerCase().includes( state.q );
				pub.hidden = ! ( matchCat && matchQ );
				if ( ! pub.hidden ) {
					visible++;
					pub.classList.add( 'is-in' );
				}
			} );
			// Hide year headings that no longer have visible papers below them.
			$$( '[data-year-divider]', list ).forEach( ( h ) => {
				let next = h.nextElementSibling;
				let any = false;
				while ( next && ! next.hasAttribute( 'data-year-divider' ) ) {
					if ( next.classList.contains( 'pub' ) && ! next.hidden ) any = true;
					next = next.nextElementSibling;
				}
				h.hidden = ! any;
			} );
			if ( empty ) empty.hidden = visible > 0;
		};

		setFilter = ( value ) => {
			state.filter = value;
			chips.forEach( ( c ) => {
				const on = c.dataset.filter === value;
				c.classList.toggle( 'is-active', on );
				c.setAttribute( 'aria-pressed', String( on ) );
			} );
			apply();
		};

		chips.forEach( ( chip ) => chip.addEventListener( 'click', () => setFilter( chip.dataset.filter ) ) );
		if ( search ) {
			search.addEventListener( 'input', () => {
				state.q = search.value.trim().toLowerCase();
				apply();
			} );
		}
	}

	// Research cards / focus chips jump to publications with their area pre-selected.
	document.addEventListener( 'click', ( e ) => {
		const link = e.target.closest( '[data-jump-filter]' );
		if ( ! link || ! setFilter ) return;
		const slug = link.dataset.jumpFilter;
		setFilter( chips.some( ( c ) => c.dataset.filter === slug ) ? slug : 'all' );
	} );

	/* ---------- Toast + copy helpers ---------- */
	const toast = $( '.toast' );
	let toastTimer;
	const showToast = ( msg ) => {
		toast.innerHTML = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7"/></svg>';
		toast.append( document.createTextNode( msg ) );
		toast.classList.add( 'is-visible' );
		clearTimeout( toastTimer );
		toastTimer = setTimeout( () => toast.classList.remove( 'is-visible' ), 2600 );
	};

	const copyText = async ( text ) => {
		try {
			await navigator.clipboard.writeText( text );
			return true;
		} catch ( e ) {
			const ta = document.createElement( 'textarea' );
			ta.value = text;
			ta.setAttribute( 'readonly', '' );
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild( ta );
			ta.select();
			const ok = document.execCommand( 'copy' );
			ta.remove();
			return ok;
		}
	};

	document.addEventListener( 'click', async ( e ) => {
		const btn = e.target.closest( '[data-cite], [data-copy]' );
		if ( ! btn ) return;
		const isCite = btn.hasAttribute( 'data-cite' );
		const ok = await copyText( isCite ? btn.dataset.cite : btn.dataset.copy );
		showToast( ok ? ( isCite ? 'Citation copied to clipboard' : 'Email address copied' ) : 'Could not copy — please select the text manually' );
	} );

	/* ---------- Contact form ---------- */
	const form = $( '#contact-form' );
	if ( form && window.scholarData ) {
		const status = $( '.form-status', form );
		const button = $( 'button[type="submit"]', form );
		const label = $( '.btn-label', button );
		const defaultLabel = label.textContent;
		const topics = $$( '.topic', form );

		topics.forEach( ( t ) => t.addEventListener( 'click', () => {
			topics.forEach( ( x ) => x.classList.toggle( 'is-active', x === t ) );
			form.elements.subject.value = t.dataset.topic;
			setFieldError( 'subject', '' );
			form.elements.message.focus();
		} ) );

		function setFieldError( name, msg ) {
			const input = form.elements[ name ];
			if ( ! input ) return;
			const field = input.closest( '.field' );
			field.classList.toggle( 'has-error', !! msg );
			$( '.field-error', field ).textContent = msg || '';
			input.setAttribute( 'aria-invalid', msg ? 'true' : 'false' );
		}

		const validate = () => {
			const errors = {};
			const v = ( n ) => form.elements[ n ].value.trim();
			if ( ! v( 'name' ) ) errors.name = 'Please enter your name.';
			if ( ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( v( 'email' ) ) ) errors.email = 'Please enter a valid email address.';
			if ( ! v( 'subject' ) ) errors.subject = 'Please add a subject.';
			if ( v( 'message' ).length < 10 ) errors.message = 'Your message should be at least 10 characters.';
			return errors;
		};

		[ 'name', 'email', 'subject', 'message' ].forEach( ( n ) => {
			form.elements[ n ].addEventListener( 'input', () => setFieldError( n, '' ) );
		} );

		form.addEventListener( 'submit', async ( e ) => {
			e.preventDefault();
			status.className = 'form-status';
			status.textContent = '';

			const errors = validate();
			[ 'name', 'email', 'subject', 'message' ].forEach( ( n ) => setFieldError( n, errors[ n ] ) );
			const firstError = Object.keys( errors )[ 0 ];
			if ( firstError ) {
				form.elements[ firstError ].focus();
				return;
			}

			button.disabled = true;
			button.classList.add( 'is-loading' );
			label.textContent = 'Sending';

			const body = new FormData( form );
			body.append( 'action', 'scholar_contact' );
			body.append( 'nonce', window.scholarData.nonce );

			try {
				const res = await fetch( window.scholarData.ajaxUrl, { method: 'POST', body, credentials: 'same-origin' } );
				const json = await res.json();
				if ( json.success ) {
					form.reset();
					topics.forEach( ( x ) => x.classList.remove( 'is-active' ) );
					status.classList.add( 'is-success' );
					status.textContent = json.data.message;
				} else {
					status.classList.add( 'is-error' );
					status.textContent = ( json.data && json.data.message ) || 'Something went wrong. Please try again.';
					Object.entries( ( json.data && json.data.fields ) || {} ).forEach( ( [ n, msg ] ) => setFieldError( n, msg ) );
				}
			} catch ( err ) {
				status.classList.add( 'is-error' );
				status.textContent = 'Network error. Please check your connection and try again.';
			} finally {
				button.disabled = false;
				button.classList.remove( 'is-loading' );
				label.textContent = defaultLabel;
			}
		} );
	}
} )();
