// Define the class names to be animated
const classNames = '.to-left,.to-edge,.to-top,.slide-to-left,.to-opacity,.to-top1,.text-top,.text-top-btn,.slide-to-left-white,.line-top,.js-observer,.scale_img,.to-right-bg,.to-left-text,.to-right-text,.atm_leaf,.atm_path,.atm_path1';

const originalTextElements = document.querySelectorAll('.js-observer');
originalTextElements.forEach(element => splitTextIntoSpans(element));
// Function to handle intersection events
function handleIntersect(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('appear');
      observer.unobserve(entry.target); // Stop observing the element once it has appeared
    }
  });
}

// Create an IntersectionObserver instance
const observer = new IntersectionObserver(handleIntersect, {
  root: null, // Use the viewport as the container
  rootMargin: '0px 0px 50px 0px', // Trigger 100px before the element enters the viewport
  threshold: 0.1 // Trigger when any part of the element is visible
});

// Select all elements to be animated
const animateElements = document.querySelectorAll(classNames);

// Start observing each element
animateElements.forEach(element => {
  observer.observe(element);
});

function splitTextIntoSpans(element) {
  const paragraphs = element.getElementsByTagName('p');
  let newContent = '';

  Array.from(paragraphs).forEach((paragraph, pIndex) => {
      const text = paragraph.innerText;
      const chars = Array.from(text);

      chars.forEach((char, index) => {
          const delay = (pIndex * chars.length + (index + 1)) * 0.04;
          if (char === ' ') {
              newContent += `<span>&nbsp;</span>`;
          } else {
              newContent += `<span style="transition-delay: ${delay}s">${char}</span>`;
          }
      });

      if (pIndex < paragraphs.length - 1) {
          newContent += '<br>';
      }
  });

  element.innerHTML = newContent;
}
function wrapWordsWithSpanAndAddClass(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent;
        const words = textContent.split(/\s+/);

        if (words.length > 1) {
            const spanFragment = document.createDocumentFragment();
            words.forEach((word, index) => {
                if (word) {
                    const wordNode = document.createElement('span');
                    wordNode.textContent = word;
                    spanFragment.appendChild(wordNode);

                    if (index < words.length - 1) {
                        spanFragment.appendChild(document.createTextNode(' '));
                    }
                }

            });

            node.parentNode.insertBefore(spanFragment, node);
            node.remove();
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.childNodes.length === 0) {
            node.classList.add('text-oth');
        } else {
            const childNodes = Array.from(node.childNodes);
            childNodes.forEach(childNode => {
                wrapWordsWithSpanAndAddClass(childNode);
            });
        }
    }
}

function getInitialTransitionDelay(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const computedStyle = window.getComputedStyle(node);
        const transitionDelay = computedStyle.transitionDelay;
        if (transitionDelay !== '0s') {
            return parseFloat(transitionDelay) || 0;
        }
    }
    return 0;
}

let transitionDelayCounter = 0;

function addTransitionDelay(node, initialDelay) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'SPAN' || node.classList.contains('text-oth')) {
            node.style.transitionDelay = `${initialDelay + transitionDelayCounter * 0.1}s`;
            transitionDelayCounter += 0.5;
        }

        for (const childNode of node.childNodes) {
            addTransitionDelay(childNode, initialDelay);
        }
    }
}

function wrapWordsWithSpanAndAddClass1(node,width) {
  if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent;
      const words = textContent.split(/\b/);
      if (words.length > 1) {
        const newContainer = document.createDocumentFragment();
        let startIndex = 0;
        let line = '';
        const testElement = document.createElement('span');
        testElement.style.display = 'inline-block';
        testElement.style.whiteSpace = 'nowrap';
        testElement.className = 'test-span-ulike';
        for (let i = 0; i < words.length; i++) {
          const char = words[i];
          testElement.textContent = line + char;
          
          // 尝试将字符添加到当前行
          node.parentNode.appendChild(testElement);
        
          // 如果当前行加上字符后超出了容器宽度，则开始新的一行
          if (parseFloat(window.getComputedStyle(testElement).width) > width) {
            node.parentNode.removeChild(testElement); // 移除用于测试的span元素
            newContainer.appendChild(document.createElement('span')).textContent = line; // 创建新span并添加上一行的内容
            line = char; // 重置当前行为当前字符
            startIndex = i; // 记录下一行开始的索引位置
          } else {
            line = line + char; // 否则，将字符添加到当前行
          }
        }
        
        // 添加最后一行内容（如果有剩余内容）
        if (line.trim() !== '') {
          newContainer.appendChild(document.createElement('span')).textContent = line.trim();
          if(node.parentNode.querySelector('.test-span-ulike')){
            node.parentNode.removeChild(testElement);
          }
        }
        node.parentNode.insertBefore(newContainer, node);
        node.remove()
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.childNodes.length === 0) {
          node.classList.add('text-oth');
      } else {
          const childNodes = Array.from(node.childNodes);
          childNodes.forEach(childNode => {
              wrapWordsWithSpanAndAddClass1(childNode,width);
          });
      }
  }
}

document.addEventListener("DOMContentLoaded", function() {
// 选择你想要遍历的根节点，这里假设根节点有 id 为 "content"
// const rootElement = document.getElementById('content');
  document.querySelectorAll(".text-top").forEach(el => {
      transitionDelayCounter = 0
      wrapWordsWithSpanAndAddClass(el);
      addTransitionDelay(el, getInitialTransitionDelay(el));
  })

  document.querySelectorAll(".line-top").forEach(el => {
    const containerWidth = parseFloat(window.getComputedStyle(el).width)
    transitionDelayCounter = 0
    wrapWordsWithSpanAndAddClass1(el,containerWidth);
    addTransitionDelay(el, getInitialTransitionDelay(el));
  })
})

function animateNumbersVisibleAnime(name) {
  let elements = document.querySelectorAll(name)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const start = 0;
        const end = parseInt(element.textContent.match(/\d+/)[0]);
        const duration = Math.max(800, Math.min(2000, Math.abs(end - start) * 20)); // 根据数字的大小调整动画时间，最小1000毫秒，最大4000毫秒
        animateNumber(element, start, end, duration);
        observer.unobserve(element); // 仅触发一次动画后停止观察
      }
    });
  });

  elements.forEach(element => {
    observer.observe(element);
  });
}

function animateNumber(element, start, end, duration) {
  const initialValue = element.textContent;
  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    const newValue = initialValue.replace(/\d+/, value.toString().padStart(initialValue.match(/\d+/)[0].length, '0'));
    element.textContent = newValue;
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}
