
const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('.main-nav');
menuButton.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});
document.querySelectorAll('.main-nav a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');}));
const observer=new IntersectionObserver((entries)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}})},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
document.getElementById('year').textContent=new Date().getFullYear();
document.getElementById('whatsappForm').addEventListener('submit',(event)=>{event.preventDefault();const name=document.getElementById('name').value.trim();const phone=document.getElementById('phone').value.trim();const email=document.getElementById('email').value.trim();const service=document.getElementById('service').value;const message=document.getElementById('message').value.trim();const text=`Hello Averex Land Solutions, I would like to make an enquiry.

Name: ${name}
Phone: ${phone||'Not provided'}
Email: ${email||'Not provided'}
Service: ${service}

Property / project details:
${message}`;window.open(`https://wa.me/263774041144?text=${encodeURIComponent(text)}`,'_blank','noopener');});
