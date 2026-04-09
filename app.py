import streamlit as st
import streamlit.components.v1 as components
import os

# Настройка страницы Streamlit
st.set_page_config(
    page_title="StreamSniper", 
    page_icon="🎯", 
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Функция для безопасного чтения файлов
def read_file(filename):
    # Получаем абсолютный путь к папке, где лежит app.py (для корректной работы на Streamlit Cloud)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, filename)
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

# Читаем исходные файлы нашего интерфейса
try:
    html_content = read_file('index.html')
    css_content = read_file('style.css')
    js_content = read_file('app.js')

    # Внедряем CSS и JS напрямую в HTML, так как Streamlit изолирует компоненты в iframe
    # и не поддерживает подключение локальных CSS/JS напрямую без статического сервера
    
    html_content = html_content.replace(
        '<link rel="stylesheet" href="style.css">', 
        f'<style>{css_content}</style>'
    )
    
    html_content = html_content.replace(
        '<script src="app.js"></script>', 
        f'<script>{js_content}</script>'
    )

    # Убираем отступы самого Streamlit и показываем нашу игру на весь экран компонента
    st.markdown("""
        <style>
            .block-container {
                padding-top: 1rem;
                padding-bottom: 0rem;
                padding-left: 0rem;
                padding-right: 0rem;
                max-width: 100%;
            }
        </style>
    """, unsafe_allow_html=True)
    
    # Запускаем HTML-приложение в компоненте
    components.html(html_content, height=850, scrolling=False)

except Exception as e:
    st.error(f"Ошибка при загрузке файлов: {e}")
